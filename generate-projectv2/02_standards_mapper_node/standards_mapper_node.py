"""
Node 2: Standards Mapper

Lean implementation assuming LLM availability.
Maps (Seed, Spec) to standards via LLM only, with deterministic grade-band filtering.
"""

import os
import sys
import json
from typing import Any, Dict, List, Optional, Tuple

# Add shared infrastructure to path (same pattern as node 1)
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared_infrastructure'))

from base_node import BaseNode
from data_structures import Seed, Spec, StandardTarget
# Env is now centrally loaded by shared_infrastructure/env_loader via BaseNode import


class StandardsMapperNode(BaseNode):
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__("StandardsMapper", config or {})

    def _process_logic(self, input_data: Any) -> List[StandardTarget]:
        seed, spec = self._coerce_input(input_data)

        # Validate input types
        if not isinstance(seed, Seed) or not isinstance(spec, Spec):
            raise ValueError("StandardsMapperNode expects (Seed, Spec) input")

        self.thoughts.analyzing("Standards mapping input received", {
            "topic": seed.topic,
            "grade_band": spec.grade_band,
            "subject": spec.subject,
        })

        # LLM-based mapping (LLM is assumed to be available)
        standards: List[StandardTarget] = self._map_with_llm(seed, spec)

        # Reverse grade-band check (deterministic)
        filtered = self._filter_by_grade_band(standards, spec.grade_band)
        if not filtered:
            raise ValueError("No mapped standards fit requested grade band")

        # Reverse validation via LLM
        is_fit, rv_meta = self._reverse_validate_llm(filtered, spec, seed)
        if not is_fit:
            # Retry with tailored hint to narrow to the requested band/topic
            hint = (
                f"Previous mapping may be out-of-band for {spec.grade_band}. "
                f"Only return standards clearly within {spec.grade_band} and aligned to '{seed.topic}'."
            )
            self.thoughts.warning("Reverse validation failed; remapping with tailored prompt", {"hint": hint, "rv_meta": rv_meta})
            standards = self._map_with_llm(seed, spec, retry_hint=hint)
            filtered = self._filter_by_grade_band(standards, spec.grade_band)
            if not filtered:
                raise ValueError("Remapping still produced no in-band standards")
            ok_after_retry, rv_meta_2 = self._reverse_validate_llm(filtered, spec, seed)
            if not ok_after_retry:
                raise ValueError("Reverse validation failed after retry")
        else:
            self.thoughts.validating("Reverse validation passed", rv_meta or {})

        # Cap the number of standards if requested
        max_standards = int(self.config.get("max_standards", 3))
        result = filtered[:max_standards]

        if not result:
            raise ValueError("StandardsMapper produced no standards")

        self.thoughts.success("Standards mapped", {
            "codes": [s.code for s in result],
            "count": len(result)
        })

        return result

    # ---------------------------
    # Internals
    # ---------------------------

    def _coerce_input(self, input_data: Any) -> Tuple[Seed, Spec]:
        """Accept (seed, spec), {seed, spec}, or object with attributes."""
        if isinstance(input_data, tuple) and len(input_data) == 2:
            seed, spec = input_data
            return seed, spec
        if isinstance(input_data, dict) and "seed" in input_data and "spec" in input_data:
            return input_data["seed"], input_data["spec"]
        # Attempt attribute access
        if hasattr(input_data, "seed") and hasattr(input_data, "spec"):
            return input_data.seed, input_data.spec
        raise ValueError("Unsupported input format for StandardsMapperNode")

    def _map_with_llm(self, seed: Seed, spec: Spec, retry_hint: Optional[str] = None) -> List[StandardTarget]:
        """LLM-based mapping. Assumes API/client availability. Returns empty list on hard errors."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set for StandardsMapperNode")

        from openai import OpenAI  # type: ignore

        try:
            # Support OpenRouter by honoring OPENAI_BASE_URL if set
            base_url = os.getenv("OPENAI_BASE_URL")
            if base_url:
                client = OpenAI(api_key=api_key, base_url=base_url)
            else:
                client = OpenAI(api_key=api_key)

            system_msg = (
                "You map K-12 math project specs to CCSS-M-like standards. "
                "Return precise, concise results within the requested grade band."
            )

            user_payload = {
                "subject": spec.subject,
                "grade_band": spec.grade_band,
                "topic": seed.topic,
                "instructions": (
                    "Return 1-3 standards within the grade band. JSON ONLY. "
                    "Format: [{\n  \"code\": \"<CCSS code>\",\n  \"description\": \"<short>\",\n  \"evidence_note\": \"<expected artifacts>\"\n}]"
                ),
            }
            if retry_hint:
                user_payload["retry_hint"] = retry_hint

            prompt = (
                "You are a standards mapping assistant. "
                "Given the following spec, produce a JSON array of 1-3 standards within the grade band.\n\n"
                + json.dumps(user_payload, ensure_ascii=False, indent=2)
                + "\n\nJSON ONLY. No prose."
            )

            response = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt},
                ],
            )

            content = response.choices[0].message.content if response.choices else ""
            if not content:
                return []

            # Some models wrap JSON with fences; attempt to extract JSON
            content = self._extract_json_block(content)
            parsed = json.loads(content)
            if not isinstance(parsed, list):
                return []

            standards: List[StandardTarget] = []
            for item in parsed[:3]:
                code = (item.get("code") or "").strip()
                description = (item.get("description") or "").strip()
                note = (item.get("evidence_note") or "").strip()
                if code and description and note:
                    standards.append(StandardTarget(code=code, description=description, evidence_note=note))

            return standards
        except Exception as e:
            # Treat LLM failures as hard errors since LLM is required in this setup
            raise

    def _reverse_validate_llm(self, standards: List[StandardTarget], spec: Spec, seed: Seed) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Ask LLM to infer the 2-grade span and topic cluster for the chosen standards.
        Returns (fits_spec_band, metadata).
        """
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set for StandardsMapperNode")

        from openai import OpenAI  # type: ignore

        client_kwargs: Dict[str, Any] = {"api_key": api_key}
        base_url = os.getenv("OPENAI_BASE_URL")
        if base_url:
            client_kwargs["base_url"] = base_url

        client = OpenAI(**client_kwargs)

        gb_start, gb_end = self._parse_grade_band(spec.grade_band)

        payload = {
            "selected_targets": [
                {"code": s.code, "description": s.description} for s in standards
            ],
            "ask": "Infer a 2-grade range and a concise math topic cluster these targets belong to.",
            "format": {
                "grade_range": "like '6-7' or '7-8'",
                "topic_cluster": "short phrase",
            },
        }

        prompt = (
            "Reverse validate the selected standards.\n"
            "- Determine the most likely 2-grade span (e.g., '6-7').\n"
            "- Determine the math topic cluster (e.g., 'geometry area').\n"
            "Respond as a single JSON object with keys: grade_range, topic_cluster.\n\n"
            + json.dumps(payload, ensure_ascii=False, indent=2)
            + "\n\nJSON ONLY. No prose."
        )

        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "You are a precise validator for curriculum targets."},
                {"role": "user", "content": prompt},
            ],
        )

        content = response.choices[0].message.content if response.choices else ""
        if not content:
            return False, {"reason": "empty_validation_response"}

        try:
            content_json = self._extract_json_block(content)
            obj = json.loads(content_json)
            grade_range_str = str(obj.get("grade_range", "")).strip()
            topic_cluster = (obj.get("topic_cluster") or "").strip()

            # Parse predicted grade range
            pred_start, pred_end = self._parse_grade_band(grade_range_str)
            if pred_start is None or pred_end is None:
                return False, {"reason": "unparseable_grade_range", "raw": grade_range_str, "topic_cluster": topic_cluster}

            fits = False
            if gb_start is not None and gb_end is not None:
                fits = gb_start <= pred_start and pred_end <= gb_end

            meta = {
                "predicted_grade_range": grade_range_str,
                "topic_cluster": topic_cluster,
                "spec_grade_band": spec.grade_band,
            }
            return fits, meta
        except Exception as e:
            return False, {"reason": "validation_parse_error", "error": str(e)}

    def _filter_by_grade_band(self, standards: List[StandardTarget], grade_band: str) -> List[StandardTarget]:
        gb_start, gb_end = self._parse_grade_band(grade_band)
        if gb_start is None and gb_end is None:
            return standards

        def code_grade(st_code: str) -> Optional[int]:
            # Extract leading integer grade from code like "6.G.A.1"; return None if absent
            digits = []
            for ch in st_code:
                if ch.isdigit():
                    digits.append(ch)
                else:
                    break
            if not digits:
                return None
            try:
                return int("".join(digits))
            except Exception:
                return None

        filtered: List[StandardTarget] = []
        for st in standards:
            g = code_grade(st.code)
            if g is None:
                # Keep non-numeric codes (e.g., TEMP.*) only if we cannot determine band
                if gb_start is None:
                    filtered.append(st)
            else:
                if gb_start is not None and gb_end is not None and gb_start <= g <= gb_end:
                    filtered.append(st)

        return filtered

    def _parse_grade_band(self, grade_band: str) -> Tuple[Optional[int], Optional[int]]:
        """Parse bands like '6-8', '3-5', '9-12'. Returns (start, end)."""
        if not grade_band:
            return None, None
        part = grade_band.strip().upper()
        # Handle common forms like "6-8", "3-5", "9-12"
        try:
            if "-" in part:
                a, b = part.split("-", 1)
                return int(a), int(b)
            if part.isdigit():
                g = int(part)
                return g, g
        except Exception:
            pass
        return None, None

    def _extract_json_block(self, text: str) -> str:
        """Extract JSON array/object from text; fallback to original text."""
        text = text.strip()
        # Remove Markdown fences if present
        if text.startswith("```"):
            # Strip first line and last fence
            lines = text.splitlines()
            # Drop first line (```json or ```)
            if lines:
                lines = lines[1:]
            # Drop trailing fence if present
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        # If the content includes leading prose, try to locate the first '[' or '{'
        first_bracket = min((i for i in [text.find("["), text.find("{")] if i != -1), default=-1)
        if first_bracket > 0:
            text = text[first_bracket:]
        return text


# Simple manual test harness
if __name__ == "__main__":
    # Basic demo run using fallback (no API key) or LLM if configured
    demo_seed = Seed(topic="fractions and area problems", grade_band="6-8")
    demo_spec = Spec(
        subject="math",
        grade_band="6-8",
        skills=["problem_solving", "collaboration"],
        time_minutes=45,
        guards={"safe_content": True},
        schema_version="0.1",
    )

    node = StandardsMapperNode()
    result = node.process((demo_seed, demo_spec))
    print("\nStandards Result:")
    if result.output:
        for st in result.output:
            print({"code": st.code, "description": st.description, "evidence_note": st.evidence_note})
    else:
        print({"state": result.state.value, "error": result.error})


