import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Users, BarChart3, Settings, Zap, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const BusinessTools = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('management');

  const managementTools = [
    { id: 'store', name: 'Marketplace Store', desc: 'Manage your product listings', icon: Store, color: 'from-blue-600 to-cyan-600', link: '/marketplace' },
    { id: 'community', name: 'Community Hub', desc: 'Build customer communities', icon: Users, color: 'from-purple-600 to-pink-600', link: '/communities' },
    { id: 'analytics', name: 'Business Analytics', desc: 'Track sales & performance', icon: BarChart3, color: 'from-green-600 to-emerald-600', link: '/payouts' },
    { id: 'customers', name: 'Customer Mgmt', desc: 'Manage your customers', icon: Users, color: 'from-orange-600 to-red-600', link: '/people' },
  ];

  const salesTools = [
    { id: 'products', name: 'Product Manager', desc: 'Add & edit products', icon: ShoppingBag, color: 'from-red-600 to-pink-600', link: '/marketplace' },
    { id: 'inventory', name: 'Inventory', desc: 'Stock management', icon: Store, color: 'from-purple-600 to-indigo-600', link: '/marketplace' },
    { id: 'orders', name: 'Orders', desc: 'View & manage orders', icon: TrendingUp, color: 'from-cyan-600 to-blue-600', link: '/marketplace' },
    { id: 'payments', name: 'Payments', desc: 'Process & receive payments', icon: DollarSign, color: 'from-yellow-600 to-orange-600', link: '/wallet' },
  ];

  const marketingTools = [
    { id: 'campaigns', name: 'Ad Campaigns', desc: 'Run targeted ads', icon: Zap, color: 'from-green-600 to-teal-600', link: '/ads' },
    { id: 'promotions', name: 'Promotions', desc: 'Create sales & discounts', icon: TrendingUp, color: 'from-indigo-600 to-purple-600', link: '/ads' },
    { id: 'social', name: 'Social Media', desc: 'Integrate social platforms', icon: Users, color: 'from-blue-600 to-cyan-600', link: '/profile' },
    { id: 'emails', name: 'Email Marketing', desc: 'Send customer campaigns', icon: Zap, color: 'from-pink-600 to-rose-600', link: '/marketplace' },
  ];

  const ToolCard = ({ tool }: any) => (
    <Link to={tool.link}>
      <Card className="glass-card hover:border-primary/50 transition cursor-pointer h-full">
        <CardContent className="p-6">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
            <tool.icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-heading font-bold text-lg mb-1">{tool.name}</h3>
          <p className="text-sm text-muted-foreground">{tool.desc}</p>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold gradient-text">Business Tools</h1>
            <p className="text-muted-foreground mt-2">Dhibiti biashara, mauzo, na wateja wako</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/settings"><Settings className="h-4 w-4 mr-2" />Settings</Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="management"><Store className="h-4 w-4 mr-2" />Management</TabsTrigger>
            <TabsTrigger value="sales"><ShoppingBag className="h-4 w-4 mr-2" />Sales</TabsTrigger>
            <TabsTrigger value="marketing"><Zap className="h-4 w-4 mr-2" />Marketing</TabsTrigger>
          </TabsList>

          <TabsContent value="management" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {managementTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {salesTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {marketingTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="glass-card bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" />Business Growth Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>📊 Tumia analytics kufahamu wateja wako</p>
            <p>🎯 Run targeted ads campaigns kwa sales</p>
            <p>👥 Build communities kujenga brand loyalty</p>
            <p>💰 Optimize pricing kwa maximum revenue</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default BusinessTools;
