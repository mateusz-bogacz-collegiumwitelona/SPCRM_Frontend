import { useParams } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { MainLayout } from '~/components/layout/main-layout';
import { TaskContactDetails } from '~/components/task/task-contact';
import { TaskNote } from '~/components/task/task-note';
import { TaskDeals } from '~/components/task/task-deals';
import { TaskInfo } from '~/components/task/task-info';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';

const TaskDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();

  if (!taskId) {
    return (
      <div className="m-6 flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium leading-tight">Nie znaleziono zadania</p>
          <p className="mt-1 text-xs text-red-700">
            Nieprawidłowy identyfikator zadania w adresie URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-white lg:bg-[#f8f9fa] w-full min-h-screen pb-12">
            <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
              <div className="block lg:hidden space-y-4">
                <TaskInfo taskId={taskId} />
                <TaskContactDetails taskId={taskId} />
                <TaskDeals taskId={taskId} />
                <TaskNote taskId={taskId} />
              </div>

              <div className="hidden lg:flex flex-row gap-8 items-start relative">
                <div className="flex-1 min-w-0 flex flex-col">
                  <TaskInfo taskId={taskId} />
                  <TaskNote taskId={taskId} />
                </div>

                <div className="w-96 shrink-0 sticky top-24 flex flex-col gap-6">
                  <TaskContactDetails taskId={taskId} />
                  <TaskDeals taskId={taskId} />
                </div>
              </div>
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
};

export default TaskDetails;
