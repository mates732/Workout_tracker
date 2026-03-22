from core.settings import _parse_cors_origins


def test_parse_single_origin() -> None:
    result = _parse_cors_origins("http://localhost:3000")
    assert result == ["http://localhost:3000"]


def test_parse_multiple_origins() -> None:
    result = _parse_cors_origins("http://localhost:3000,http://192.168.1.100:3000")
    assert result == ["http://localhost:3000", "http://192.168.1.100:3000"]


def test_parse_origins_strips_whitespace() -> None:
    result = _parse_cors_origins("http://localhost:3000 , http://192.168.1.5:3000")
    assert result == ["http://localhost:3000", "http://192.168.1.5:3000"]


def test_parse_empty_string_returns_empty_list() -> None:
    result = _parse_cors_origins("")
    assert result == []
