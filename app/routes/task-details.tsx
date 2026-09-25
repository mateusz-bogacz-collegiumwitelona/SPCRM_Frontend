import { useParams } from 'react-router';
import { MainLayout } from '~/components/layout/main-layout';
import { TaskContactDetails } from '~/components/task/task-contact';
import { TaskNote } from '~/components/task/task-note';
import { TaskDeals } from '~/components/task/task-deals';
import { TaskInfo } from '~/components/task/task-info';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { useQuery } from '@tanstack/react-query';
import { api, isNotFoundError } from '~/api/api';
import NotFound from '~/routes/not-found';
import { PageLoader } from '~/components/layout/page-loader';
import { STANDARD_ROLES } from '~/constants/roles';

const TaskDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();

  const { error, isLoading } = useQuery({
    queryKey: ['task-core-details', taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}`);
      return res.data?.data || res.data?.value || res.data;
    },
    enabled: !!taskId,
    retry: false,
  });

  if (!taskId || isNotFoundError(error)) {
    return <NotFound />;
  }

  if (isLoading) {
    return <PageLoader message="Wczytywanie szczegółów zadania..." />;
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={STANDARD_ROLES}>
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
