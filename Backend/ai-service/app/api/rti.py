from fastapi import APIRouter, HTTPException, status
from app.models.request_models import RTIDraftRequest
from app.services.rti_service import process_rti_request, RTIServiceRequest, RTIProcessResponse

router = APIRouter(tags=["RTI Assistance"])


@router.post("/rti/process", response_model=RTIProcessResponse, summary="Execute Search Before Filing & generate RTI draft")
async def rti_process_endpoint(request: RTIDraftRequest):
    """
    Evaluates citizen RTI query using 'Search Before Filing'. Returns existing document citations
    if available or generates formal RTI draft if public info is missing.
    """
    try:
        service_req = RTIServiceRequest(
            informationRequested=request.topic,
            department=request.department,
            applicantName=request.applicantName or "Citizen Applicant"
        )
        return process_rti_request(service_req)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"RTI Service error: {str(e)}")
