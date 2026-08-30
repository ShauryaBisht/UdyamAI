from enum import Enum


class SupportedLanguage(str, Enum):
    EN = "en"
    HI = "hi"
    MR = "mr"


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SchemeMatchStatus(str, Enum):
    POTENTIAL_MATCH = "potential_match"
    NOT_MATCHED = "not_matched"
    INSUFFICIENT_INFORMATION = "insufficient_information"


class BeneficiaryCategory(str, Enum):
    SC = "SC"
    ST = "ST"
    OBC = "OBC"
    GENERAL = "General"
    WOMEN = "Women"
    MINORITY = "Minority"
    DIFFERENTLY_ABLED = "Differently Abled"
    EX_SERVICEMEN = "Ex-Servicemen"
