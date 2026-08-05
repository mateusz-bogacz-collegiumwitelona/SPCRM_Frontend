import { useParams } from 'react-router';
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
      <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
        <p className="font-bold">Coś poszło nie tak</p>
        <p>Nie można wyświetlić danytch notatki</p>
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
