import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, ChevronRight, Sparkles } from 'lucide-react';

/** Profile entry point into the company / business workspace. */
export const CompanyProfileEntry = () => (
  <Link to="/profile/company">
    <Card className="glass-card hover:border-primary/50 transition cursor-pointer">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading font-bold">Biashara & Kampuni</p>
            <Badge variant="outline" className="text-[10px] gap-1">
              <Sparkles className="h-2.5 w-2.5" /> AI Tools
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Fungua kampuni, jaza template, washa tools zote za creator, business, development na enterprise.
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  </Link>
);
