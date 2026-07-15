import requests
import uuid

BASE_URL = "http://localhost:3000"

def test_post_api_webhooks_vapi_agencyid_valid_transcript_event():
    agency_id = str(uuid.uuid4())
    url = f"{BASE_URL}/api/webhooks/vapi/{agency_id}"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "message": {
            "type": "transcript",
            "call": {
                "id": str(uuid.uuid4())
            },
            "event": {
                "transcript": "Hello, this is a test transcript message.",
                "timestamp": "2026-07-15T12:00:00Z"
            }
        }
    }
    
    # Send POST request with valid transcript event payload
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
    json_resp = response.json()
    assert "ok" in json_resp and json_resp["ok"] is True, f"Expected response {{'ok': True}}, got {json_resp}"
    
    # Verify that the transcript event is persisted in the call_events table
    # This requires an additional verification endpoint or database query.
    # Since no endpoint is described for verification, we simulate verification by querying a GET endpoint if exists:
    # Assume a GET /api/call_events?callId=payload['message']['call']['id'] returns persisted events for this call (not specified in PRD)
    # If such endpoint does not exist, the verification cannot be done via API; thus, we only verify response correctness here.
    # For a realistic test, we would mock or check database directly or add GET endpoint in API.
    
    # Since no verification method is given, this part is omitted.
    # The key check as per PRD is the 200 {ok: true} response on valid payload.

test_post_api_webhooks_vapi_agencyid_valid_transcript_event()