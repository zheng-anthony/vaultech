from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from handlers import files

app = APIGatewayRestResolver()
app.include_router(files.router, prefix="/files")

def handler(event, context):
    return app.resolve(event, context)
