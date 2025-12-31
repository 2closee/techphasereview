import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, CreditCard, TrendingUp, Calendar } from 'lucide-react';

const stats = [
  { title: 'Total Students', value: '248', change: '+12%', icon: Users, color: 'text-blue-500' },
  { title: 'Teachers', value: '18', change: '+2', icon: GraduationCap, color: 'text-green-500' },
  { title: 'Active Programs', value: '12', change: '4 culinary, 8 fashion', icon: BookOpen, color: 'text-purple-500' },
  { title: 'Revenue (Month)', value: '₦4.2M', change: '+18%', icon: CreditCard, color: 'text-primary' },
];

const recentActivity = [
  { action: 'New student enrolled', name: 'Adaobi Nkem', program: 'Professional Pastry', time: '2 hours ago' },
  { action: 'Payment received', name: 'Chidi Okonkwo', program: 'Fashion Design', time: '3 hours ago' },
  { action: 'Course completed', name: 'Fatima Bello', program: 'Culinary Arts', time: '5 hours ago' },
  { action: 'New registration', name: 'Emeka Eze', program: 'Tailoring Basics', time: '1 day ago' },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Welcome to Topearl LMS
                </h2>
                <p className="text-muted-foreground mt-1">
                  Manage your institute's operations from one place
                </p>
              </div>
              <div className="hidden md:block">
                <Calendar className="w-16 h-16 text-primary/30" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 bg-secondary rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions and recent activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <button className="p-4 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors">
                <Users className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium text-foreground">Add Student</p>
                <p className="text-xs text-muted-foreground">Register new student</p>
              </button>
              <button className="p-4 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors">
                <GraduationCap className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium text-foreground">Add Teacher</p>
                <p className="text-xs text-muted-foreground">Onboard new staff</p>
              </button>
              <button className="p-4 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors">
                <BookOpen className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium text-foreground">Create Program</p>
                <p className="text-xs text-muted-foreground">Add new course</p>
              </button>
              <button className="p-4 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors">
                <CreditCard className="w-5 h-5 text-primary mb-2" />
                <p className="font-medium text-foreground">Record Payment</p>
                <p className="text-xs text-muted-foreground">Log fee payment</p>
              </button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across the institute</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.name} • {activity.program}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
