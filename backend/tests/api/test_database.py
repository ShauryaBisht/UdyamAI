from unittest.mock import patch
from app.database import verify_db_connection

def test_verify_db_connection_success():
    with patch("app.database.Session") as mock_session_cls:
        mock_session = mock_session_cls.return_value.__enter__.return_value
        mock_session.execute.return_value = None
        
        result = verify_db_connection()
        assert result is True

def test_verify_db_connection_failure():
    with patch("app.database.Session") as mock_session_cls:
        mock_session = mock_session_cls.return_value.__enter__.return_value
        mock_session.execute.side_effect = Exception("DB Connection Refused")
        
        result = verify_db_connection()
        assert result is False
