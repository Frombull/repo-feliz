class DomainError(Exception):
    """Erro de regra do dominio. A camada da API converte em resposta HTTP."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(DomainError):
    """O recurso pedido nao existe (404)."""


class ConflictError(DomainError):
    """A operacao conflita com o estado atual dos dados (409)."""


class BusinessRuleError(DomainError):
    """Os dados sao validos, mas violam uma regra de negocio (422)."""
