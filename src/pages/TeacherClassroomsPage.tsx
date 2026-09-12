import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Icon } from '@components/ui/Icon';
import { mockClassrooms } from '@services/mockData';
import { cn } from '@utils';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export function TeacherClassroomsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassroom, setNewClassroom] = useState({ name: '', description: '' });

  const handleCreate = () => {
    if (newClassroom.name.trim()) {
      setShowCreateModal(false);
      setNewClassroom({ name: '', description: '' });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">Classrooms</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">Manage your classrooms and students</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Icon name="plus" />}>Create Classroom</Button>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {mockClassrooms.map((classroom, index) => (
          <motion.div
            key={classroom.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
          >
            <Card variant="glass" hover>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{classroom.name}</CardTitle>
                </div>
                <Badge variant={classroom.isActive ? 'success' : 'default'} size="sm" dot>
                  {classroom.isActive ? 'Active' : 'Archived'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <motion.div 
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="key" className="text-brand-600" />
                    <div>
                      <p className="text-xs text-surface-500 dark:text-surface-400">Class Code</p>
                      <p className="font-mono font-medium text-brand-600 dark:text-brand-400">{classroom.code}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Copy</Button>
                </motion.div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <motion.div 
                    className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{classroom.studentCount}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Students</p>
                  </motion.div>
                  <motion.div 
                    className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{classroom.settings.allowDuel ? '✓' : '✗'}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Duels</p>
                  </motion.div>
                  <motion.div 
                    className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{classroom.settings.allowPractice ? '✓' : '✗'}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Practice</p>
                  </motion.div>
                  <motion.div 
                    className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{classroom.settings.allowAdaptive ? '✓' : '✗'}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Adaptive</p>
                  </motion.div>
                </div>

                {classroom.description && (
                  <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">{classroom.description}</p>
                )}
              </CardContent>
              <CardFooter className="pt-4">
                <div className="flex gap-2">
                  <NavLink to={`/teacher/classrooms/${classroom.id}`}>
                    <Button variant="outline" fullWidth size="sm">View Details</Button>
                  </NavLink>
                  <Button variant="ghost" fullWidth size="sm">Settings</Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card variant="glass" className="border-2 border-dashed border-surface-300 dark:border-surface-600 hover:border-brand-500 transition-colors">
            <CardContent className="pt-0">
              <motion.button 
                className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-4"
                onClick={() => setShowCreateModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon name="plus" size={48} className="text-surface-400" />
                <span className="font-medium text-surface-600 dark:text-surface-400">Create New Classroom</span>
                <span className="text-sm text-surface-500 dark:text-surface-400">Click to get started</span>
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Classroom" size="md">
        <div className="space-y-4">
          <Input
            label="Classroom Name"
            placeholder="e.g., CS 101 - Data Structures"
            value={newClassroom.name}
            onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="Brief description of the classroom"
            value={newClassroom.description}
            onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
            as="textarea"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-surface-300" /> Duels
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-surface-300" /> Practice
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-surface-300" /> Adaptive
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-surface-300" /> Public visibility
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Classroom</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}