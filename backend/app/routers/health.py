from fastapi import APIRouter
router=APIRouter(tags=['system'])
@router.get('/health')
def health():return {'status':'ok','service':'jarvis-commerceos-api','version':'0.2.0'}
