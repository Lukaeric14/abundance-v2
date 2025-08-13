from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE

# Supabase client for API access
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

def fetch_project_spec(project_id):
    """Fetch project spec_json using Supabase client"""
    result = supabase.table("projects").select("spec_json").eq("id", project_id).execute()
    if result.data:
        return result.data[0]["spec_json"]
    return None

def upsert_spec(project_id, spec_json):
    """Update project spec_json using Supabase client"""
    try:
        print(f"Updating project {project_id} with spec_json")
        result = supabase.table("projects").update({
            "spec_json": spec_json,
            "updated_at": "now()"
        }).eq("id", project_id).execute()
        print(f"Update result: {result}")
        if result.data:
            print(f"Successfully updated project {project_id}")
        else:
            print(f"No rows updated for project {project_id}")
    except Exception as e:
        print(f"Error updating project {project_id}: {e}")
        raise