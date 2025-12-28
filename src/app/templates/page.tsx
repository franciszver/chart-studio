import AppLayout from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TemplatesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="mt-2 text-muted-foreground">
            Pre-built dashboard templates and report configurations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Complete sales performance overview</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Revenue, expenses, and profitability</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operations Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">Workflow and productivity metrics</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
