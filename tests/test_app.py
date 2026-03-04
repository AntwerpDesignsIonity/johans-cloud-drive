from src import app


def test_main(capsys):
    app.main()
    captured = capsys.readouterr()
    assert "Hello from sample app" in captured.out
