import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Shield, Edit, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getPolicies, deletePolicy, Policy } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function AdminPolicies() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPolicies = async () => { try { setPolicies(await getPolicies()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchPolicies(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deletePolicy(deleteId); toast({ title: t('messages.deleteSuccess') }); fetchPolicies(); } catch (e) { toast({ title: t('messages.errorOccurred'), variant: 'destructive' }); }
    setDeleteId(null);
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title={t('nav.policies')}><Link to="/admin/policies/create"><Button className="btn-gradient"><Plus className="h-4 w-4 me-2" />{t('admin.createPolicy')}</Button></Link></PageHeader>
      {policies.length > 0 ? (
        <div className="grid gap-4">
          {policies.map((policy, i) => (
            <motion.div key={policy.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard hover>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4"><div className="p-3 rounded-xl bg-primary/10"><Shield className="h-6 w-6 text-primary" /></div><div><h3 className="font-semibold">{policy.title}</h3><p className="text-sm text-muted-foreground line-clamp-2 mt-1">{policy.content}</p><p className="text-xs text-muted-foreground mt-2">{format(policy.createdAt, 'MMM dd, yyyy')}</p></div></div>
                  <div className="flex gap-2"><Link to={`/admin/policies/edit/${policy.id}`}><Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button></Link><Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(policy.id)}><Trash2 className="h-4 w-4" /></Button></div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : <GlassCard><EmptyState icon={Shield} title={t('common.noData')} description={t('admin.noPolicies')} action={<Link to="/admin/policies/create"><Button className="btn-gradient"><Plus className="h-4 w-4 me-2" />{t('admin.createPolicy')}</Button></Link>} /></GlassCard>}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}><AlertDialogContent className="glass-card"><AlertDialogHeader><AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle><AlertDialogDescription>{t('admin.confirmDelete')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </DashboardLayout>
  );
}
