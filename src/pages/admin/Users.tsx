import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, UserCheck, UserX } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getUsers, updateUserStatus } from '@/lib/firestore';
import { EmptyState } from '@/components/ui/empty-state';
import { DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<DocumentData[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; userId: string; action: 'activate' | 'disable' }>({ open: false, userId: '', action: 'activate' });

  const fetchUsers = async () => {
    try {
      const data = await getUsers(roleFilter === 'all' ? undefined : roleFilter);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const handleStatusChange = async () => {
    try {
      await updateUserStatus(confirmDialog.userId, confirmDialog.action === 'activate' ? 'active' : 'disabled');
      toast({ title: t('messages.updateSuccess') });
      fetchUsers();
    } catch (error) {
      toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
    } finally {
      setConfirmDialog({ open: false, userId: '', action: 'activate' });
    }
  };

  const filteredUsers = users.filter(u => u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title={t('nav.users')}>
        <div className="flex gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="doctor">{t('roles.doctor')}</SelectItem>
              <SelectItem value="patient">{t('roles.patient')}</SelectItem>
              <SelectItem value="lab">{t('roles.lab')}</SelectItem>
              <SelectItem value="admin">{t('roles.admin')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative"><Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t('common.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ps-10 w-48" /></div>
        </div>
      </PageHeader>
      <GlassCard className="overflow-hidden p-0 bg-transparent border-none sm:bg-card sm:border">
        {filteredUsers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto bg-card border border-border/50 rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>{t('admin.name')}</TableHead>
                    <TableHead>{t('admin.email')}</TableHead>
                    <TableHead>{t('common.role')}</TableHead>
                    <TableHead>{t('appointments.status')}</TableHead>
                    <TableHead className="text-end">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border/50">
                      <TableCell className="font-semibold">{user.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <span className="capitalize px-2 py-1 rounded bg-secondary/50 text-[11px] font-bold">
                          {t(`roles.${user.role}`)}
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={user.status} /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {user.status === 'active' ? (
                            <Button size="sm" variant="ghost" onClick={() => setConfirmDialog({ open: true, userId: user.id, action: 'disable' })} className="text-destructive hover:bg-destructive/10">
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setConfirmDialog({ open: true, userId: user.id, action: 'activate' })} className="text-success hover:bg-success/10">
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 rounded-2xl glass-card border-border/30 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pe-2">
                      <p className="font-bold text-foreground truncate">{user.fullName}</p>
                      <p className="text-[11px] text-muted-foreground truncate opacity-70 mb-1">{user.email}</p>
                      <span className="capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {t(`roles.${user.role}`)}
                      </span>
                    </div>
                    <StatusBadge status={user.status} className="text-[10px]" />
                  </div>

                  <div className="pt-2 border-t border-border/20 flex justify-end">
                    {user.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, userId: user.id, action: 'disable' })} className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 h-9 gap-2">
                        <UserX className="h-4 w-4" />
                        {t('admin.disableAccount')}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, userId: user.id, action: 'activate' })} className="w-full text-success border-success/20 hover:bg-success/10 h-9 gap-2">
                        <UserCheck className="h-4 w-4" />
                        {t('admin.activateAccount')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-20">
            <EmptyState title={t('common.noData')} description={t('admin.noUsersMatch')} />
          </div>
        )}
      </GlassCard>
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}><AlertDialogContent className="glass-card"><AlertDialogHeader><AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle><AlertDialogDescription>{confirmDialog.action === 'disable' ? t('admin.confirmDisable') : t('admin.activateUserConfirm')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={handleStatusChange} className="btn-gradient">{t('common.confirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </DashboardLayout>
  );
}
