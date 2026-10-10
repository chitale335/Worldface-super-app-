import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toolsByCategory } from '@/lib/companyTools';

interface Props {
  activeKeys?: string[] | null;
  emptyHint?: string;
}

/** All company tools, grouped by Creator / Business / Development / Enterprise. */
export const CompanyToolsGrid = ({ activeKeys, emptyHint }: Props) => {
  const categories = toolsByCategory(activeKeys);

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {emptyHint ?? 'Hakuna tools iliyowashwa bado.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat.value} className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-bold">{cat.label}</h3>
            <Badge variant="outline" className="text-[10px]">{cat.tools.length}</Badge>
            <span className="text-xs text-muted-foreground">{cat.blurb}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {cat.tools.map((tool) => (
              <Link key={tool.key} to={tool.link}>
                <Card className="glass-card hover:border-primary/50 transition cursor-pointer h-full">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0`}>
                      <tool.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
