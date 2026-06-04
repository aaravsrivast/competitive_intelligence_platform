from typing import Annotated, List, Union

from fastapi import Depends, HTTPException, status

from utils.jwt_utils import CurrentUser, get_current_user


async def require_tenant_user(
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    if user.role == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin cannot access tenant data endpoints",
        )
    if not user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant context required",
        )
    return user


def require_tenant_roles(allowed: Union[str, List[str]]):
    allowed_list: List[str] = [allowed] if isinstance(allowed, str) else list(allowed)

    async def _dep(
        user: Annotated[CurrentUser, Depends(require_tenant_user)],
    ) -> CurrentUser:
        if user.role not in allowed_list:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _dep


def tenant_id(user: CurrentUser) -> str:
    tid = user.tenant_id
    if not tid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant context required",
        )
    return tid
