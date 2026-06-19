import type { TaskCalendarResponse } from '~/interfaces/task-calendar-response';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Link } from 'react-router';
import { Calendar, User, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface TaskDialogProps {
  task: TaskCalendarResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({ task, isOpen, onClose }) => {
  if (!task) return null;

  const isCompleted = task.status === 'Complete' || task.status === 'Zakończona';
  const isOverdue = new Date(task.dueAt) < new Date() && !isCompleted;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <DialogTitle className="text-xl font-normal text-blue-900 leading-tight pr-6">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex flex-col sm:flex-row gap-4 justify-between bg-gray-50 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Termin:</span>
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {format(new Date(task.dueAt), 'dd MMM yyyy, HH:mm', { locale: pl })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle
                  className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-blue-500'}`}
                />
              )}
              <span className="font-medium">Status:</span>
              <span>{task.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700 px-1">
            <span className="font-medium">Priorytet:</span>
            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase tracking-wider">
              {task.priority}
            </span>
          </div>

          {(task.contactId || task.dealId) && (
            <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Powiązane z
              </h4>

              {task.contactId && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Kontakt:</span>
                  <Link
                    to={`/contact/${task.contactId}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {task.contactFirstName} {task.contactLastName}
                  </Link>
                </div>
              )}

              {task.dealId && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Transakcja:</span>
                  {/* NA PRZYŁOŚĆ */}
                  <Link
                    to={`/deal/${task.dealId}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {task.dealName}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Przyciski akcji na dole */}
        <div className="pt-5 mt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Zamknij
          </Button>
          {/* Przycisk do przyszłej dedykowanej strony ze szczegółami zadań */}
          <Link to={`/task/${task.id}`}>
            <Button className="w-full sm:w-auto bg-blue-900 text-white hover:bg-blue-800">
              Szczegóły zadania
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};
