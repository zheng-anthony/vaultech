from aws_lambda_powertools.event_handler.router import APIGatewayRouter

router = APIGatewayRouter()

@router.get("/")
def list_files():
    return {"files": []}