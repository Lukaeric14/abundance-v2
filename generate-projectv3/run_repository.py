from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

try:
    import psycopg
except Exception:  # pragma: no cover
    psycopg = None  # type: ignore


class RunsRepository:
    """Optional Postgres-backed runs repository. No-op if DATABASE_URL missing.

    Schema expectation:
      create table if not exists runs (
        run_id text primary key,
        project_id text,
        status text,
        started_at double precision,
        completed_at double precision,
        node_timings jsonb default '{}'::jsonb,
        error text
      );
    """

    def __init__(self) -> None:
        self._url = os.getenv("DATABASE_URL")
        self._conn = None
        if self._url and psycopg is not None:
            try:
                self._conn = psycopg.connect(self._url, autocommit=True)
                with self._conn.cursor() as cur:
                    cur.execute(
                        """
                        create table if not exists runs (
                          run_id text primary key,
                          project_id text,
                          status text,
                          started_at double precision,
                          completed_at double precision,
                          node_timings jsonb default '{}'::jsonb,
                          error text
                        )
                        """
                    )
            except Exception:
                self._conn = None

    def create(self, run_id: str, project_id: Optional[str]) -> None:
        if not self._conn:
            return
        with self._conn.cursor() as cur:
            cur.execute(
                "insert into runs(run_id, project_id, status) values (%s,%s,%s) on conflict (run_id) do nothing",
                (run_id, project_id, "queued"),
            )

    def mark_started(self, run_id: str) -> None:
        if not self._conn:
            return
        with self._conn.cursor() as cur:
            cur.execute(
                "update runs set status=%s, started_at=%s where run_id=%s",
                ("running", time.time(), run_id),
            )

    def mark_completed(self, run_id: str) -> None:
        if not self._conn:
            return
        with self._conn.cursor() as cur:
            cur.execute(
                "update runs set status=%s, completed_at=%s where run_id=%s",
                ("complete", time.time(), run_id),
            )

    def mark_error(self, run_id: str, message: str) -> None:
        if not self._conn:
            return
        with self._conn.cursor() as cur:
            cur.execute(
                "update runs set status=%s, completed_at=%s, error=%s where run_id=%s",
                ("error", time.time(), message, run_id),
            )


