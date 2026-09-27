import type {
  UserBaseActionData,
  UserListResponse,
  UserRoleActionData,
  UserToEdit,
} from '~/types/user';
import { getRoleConfig } from '~/constants/role-translator';
import { ROLES } from '~/constants/roles';
import {
  Ban,
  CheckCircle2,
  Edit2,
  Mail,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  UserCog,
} from 'lucide-react';
import { Link } from 'react-router';
import { HasRole } from '~/components/guards/has-role';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Button } from '~/components/ui/button';

export const UserMobileCard = ({
  user,
  onLockout,
  onUnlock,
  onDelete,
  onEdit,
  onChangeEmail,
  onChangeRole,
}: {
  readonly user: UserListResponse;
  readonly onLockout: (user: UserRoleActionData) => void;
  readonly onUnlock: (user: UserBaseActionData) => void;
  readonly onDelete: (user: UserRoleActionData) => void;
  readonly onEdit: (user: UserToEdit) => void;
  readonly onChangeEmail: (user: UserBaseActionData) => void;
  readonly onChangeRole: (user: UserRoleActionData) => void;
}) => {
  const roleConfig = getRoleConfig(user.role);
  const fullName = `${user.firstName} ${user.lastName}`;
  const isTargetAdmin = user.role?.toLowerCase() === ROLES.ADMIN.toLowerCase();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-blue-900">{fullName}</p>
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${roleConfig.bgColor} ${roleConfig.textColor}`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${roleConfig.iconColor}`} />
              {roleConfig.label}
            </span>
          </div>
        </div>
        {user.isBlocked ? (
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
            Zablokowany
          </span>
        ) : (
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
            Aktywny
          </span>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs">
        <div>
          {isTargetAdmin ? (
            <span className="text-gray-400 text-xs italic">Konto administracyjne</span>
          ) : (
            <Link to={`/user/${user.id}`} className="font-medium text-blue-900 hover:underline">
              Szczegóły profilu
            </Link>
          )}
        </div>

        <HasRole allowedRoles={[ROLES.ADMIN]}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-blue-900 cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-44 bg-white shadow-lg border border-gray-200"
            >
              <DropdownMenuItem
                onClick={() =>
                  onEdit({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                  })
                }
                className="cursor-pointer text-xs text-gray-700 focus:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="h-3.5 w-3.5 text-blue-800" />
                <span>Edytuj</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  onChangeEmail({
                    id: user.id,
                    fullName,
                  })
                }
                className="cursor-pointer text-xs text-gray-700 focus:bg-gray-50 flex items-center gap-2"
              >
                <Mail className="h-3.5 w-3.5 text-slate-700" />
                <span>Zmień e-mail</span>
              </DropdownMenuItem>

              {!isTargetAdmin && (
                <DropdownMenuItem
                  onClick={() =>
                    onChangeRole({
                      id: user.id,
                      fullName,
                      role: user.role,
                    })
                  }
                  className="cursor-pointer text-xs text-indigo-700 focus:bg-indigo-50 flex items-center gap-2"
                >
                  <UserCog className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Zmień rolę</span>
                </DropdownMenuItem>
              )}

              {user.isBlocked ? (
                <DropdownMenuItem
                  onClick={() => onUnlock({ id: user.id, fullName })}
                  className="cursor-pointer text-xs text-green-700 focus:bg-green-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  <span>Odblokuj</span>
                </DropdownMenuItem>
              ) : (
                !isTargetAdmin && (
                  <DropdownMenuItem
                    onClick={() =>
                      onLockout({
                        id: user.id,
                        fullName,
                        role: user.role,
                      })
                    }
                    className="cursor-pointer text-xs text-amber-700 focus:bg-amber-50 flex items-center gap-2"
                  >
                    <Ban className="h-3.5 w-3.5 text-amber-600" />
                    <span>Zablokuj</span>
                  </DropdownMenuItem>
                )
              )}

              {!isTargetAdmin && (
                <DropdownMenuItem
                  onClick={() =>
                    onDelete({
                      id: user.id,
                      fullName,
                      role: user.role,
                    })
                  }
                  className="cursor-pointer text-xs text-red-600 focus:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  <span>Usuń</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </HasRole>
      </div>
    </div>
  );
};
