from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

_database: Optional[AsyncIOMotorDatabase] = None


def set_database(db: AsyncIOMotorDatabase) -> None:
    global _database
    _database = db


def get_database() -> AsyncIOMotorDatabase:
    if _database is None:
        raise RuntimeError("Database not initialized")
    return _database


async def ensure_all_indexes() -> None:
    from models.chatbot_model import ChatbotModel
    from models.clinical_trial_model import ClinicalTrialModel
    from models.competitive_landscape_model import CompetitiveLandscapeModel
    from models.feedback_model import FeedbackModel
    from models.log_model import LogModel
    from models.news_model import NewsModel
    from models.note_model import NoteModel
    from models.publication_model import PublicationModel
    from models.report_model import ReportModel
    from models.social_media_model import SocialMediaPostModel
    from models.tenant_model import TenantModel
    from models.therapeutic_area_model import TherapeuticAreaModel
    from models.indication_model import IndicationModel
    from models.user_model import UserModel

    await TenantModel.ensure_indexes()
    await UserModel.ensure_indexes()
    await TherapeuticAreaModel.ensure_indexes()
    await IndicationModel.ensure_indexes()
    await NewsModel.ensure_indexes()
    await SocialMediaPostModel.ensure_indexes()
    await PublicationModel.ensure_indexes()
    await CompetitiveLandscapeModel.ensure_indexes()
    await NoteModel.ensure_indexes()
    await FeedbackModel.ensure_indexes()
    await ChatbotModel.ensure_indexes()
    await LogModel.ensure_indexes()
    await ReportModel.ensure_indexes()
    await ClinicalTrialModel.ensure_indexes()
