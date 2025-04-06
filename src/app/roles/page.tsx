'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Plus, GripVertical, Trash2, Pencil } from "lucide-react";
import { AppSidebar } from '@/components/app-sidebar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { fetchRoles, createRole, updateRole, deleteRole, Role } from '@/src/firebase/shiftService';

export default function RoleManagerPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>({ name: '', order: 0 });
  const [editingRole, setEditingRole] = useState<Role>({ id: '', name: '', order: 0 });
  const [draggedRole, setDraggedRole] = useState<Role | null>(null);

  // Fetch roles on component mount
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const fetchedRoles = await fetchRoles();
      setRoles(fetchedRoles);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: "Error",
        description: "Failed to load roles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      const newRoleData = {
        name: newRole.name,
        order: roles.length, // Add to end of list
      };
      await createRole(newRoleData);
      toast({
        title: "Success",
        description: "Role created successfully.",
      });
      setCreateDialogOpen(false);
      setNewRole({ name: '', order: 0 });
      loadRoles();
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async () => {
    try {
      await updateRole(editingRole.id, editingRole);
      toast({
        title: "Success",
        description: "Role updated successfully.",
      });
      setEditDialogOpen(false);
      setEditingRole({ id: '', name: '', order: 0 });
      loadRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      toast({
        title: "Success",
        description: "Role deleted successfully.",
      });
      loadRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (role: Role) => {
    setDraggedRole(role);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-accent');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('bg-accent');
  };

  const handleDrop = async (e: React.DragEvent<HTMLTableRowElement>, targetRole: Role) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-accent');

    if (!draggedRole || draggedRole.id === targetRole.id) return;

    try {
      const newRoles = [...roles];
      const draggedIndex = newRoles.findIndex(r => r.id === draggedRole.id);
      const targetIndex = newRoles.findIndex(r => r.id === targetRole.id);

      // Remove dragged role and insert at new position
      newRoles.splice(draggedIndex, 1);
      newRoles.splice(targetIndex, 0, draggedRole);

      // Update order for all roles
      const updatedRoles = newRoles.map((role, index) => ({
        ...role,
        order: index,
      }));

      // Update all roles in Firebase
      await Promise.all(updatedRoles.map(role => updateRole(role.id, role)));
      
      setRoles(updatedRoles);
      setDraggedRole(null); // Reset the draggedRole state
      toast({
        title: "Success",
        description: "Roles reordered successfully.",
      });
    } catch (error) {
      console.error('Error reordering roles:', error);
      toast({
        title: "Error",
        description: "Failed to reorder roles. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppSidebar>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>
              Manage roles and their display order in the schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Roles</h2>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-4">Loading roles...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow
                      key={role.id}
                      draggable
                      onDragStart={() => handleDragStart(role)}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, role)}
                      className={draggedRole?.id === role.id ? 'opacity-50' : ''}
                    >
                      <TableCell>
                        <GripVertical className="h-4 w-4 cursor-move" />
                      </TableCell>
                      <TableCell>{role.name}</TableCell>
                      <TableCell>{role.order}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRole(role);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Role Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
              <DialogDescription>
                Create a new role for the schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>Create Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update role details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">
                  Name
                </Label>
                <Input
                  id="editName"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppSidebar>
  );
} 