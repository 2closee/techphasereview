import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, ClipboardList, Clock, Calendar, CheckCircle2 } from 'lucide-react';

const stats = [
  { title: 'My Students', value: '42', icon: Users, color: 'text-blue-500' },
  { title: 'Active Classes', value: '3', icon: BookOpen, color: 'text-green-500' },
  { title: 'Pending Attendance', value: '2', icon: ClipboardList, color: 'text-orange-500' },
  { title: 'Today\'s Classes', value: '4', icon: Clock, color: 'text-purple-500' },
];

const todaySchedule = [
  { time: '09:00 AM', class: 'Basic Pastry Techniques', students: 15, room: 'Kitchen A' },
  { time: '11:00 AM', class: 'Advanced Baking', students: 12, room: 'Kitchen B' },
  { time: '02:00 PM', class: 'Cake Decoration', students: 18, room: 'Studio 1' },
  { time: '04:00 PM', class: 'Food Presentation', students: 10, room: 'Kitchen A' },
];

const pendingTasks = [
  { task: 'Submit attendance for Basic Pastry', due: 'Today' },
  { task: 'Grade practical exams - Advanced Baking', due: 'Tomorrow' },
  { task: 'Update course materials', due: 'This week' },
  { task: 'Student progress reports', due: 'Friday' },
];

export default function TeacherDashboard() {
  return (
    <DashboardLayout title="Teacher Dashboard">
      <div className="space-y-6">
        {/* Welcome banner */}
        <Card className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Good Morning, Teacher!
                </h2>
                <p className="text-muted-foreground mt-1">
                  You have 4 classes scheduled for today
                </p>
              </div>
              <div className="hidden md:block">
                <Calendar className="w-16 h-16 text-green-500/30" />
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
                  </div>
                  <div className={`p-3 bg-secondary rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Schedule and Tasks */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your classes for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySchedule.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                    <div className="text-center min-w-[70px]">
                      <p className="text-sm font-semibold text-primary">{item.time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.class}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.students} students • {item.room}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Pending Tasks
              </CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer">
                    <div className="w-5 h-5 border-2 border-muted-foreground rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-transparent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.task}</p>
                      <p className="text-xs text-muted-foreground">Due: {item.due}</p>
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
