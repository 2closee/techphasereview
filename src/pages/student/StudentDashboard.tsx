import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Clock, CreditCard, Award, Calendar, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const stats = [
  { title: 'Enrolled Courses', value: '3', icon: BookOpen, color: 'text-blue-500' },
  { title: 'Attendance Rate', value: '92%', icon: Clock, color: 'text-green-500' },
  { title: 'Balance Due', value: '₦150,000', icon: CreditCard, color: 'text-orange-500' },
  { title: 'Certificates', value: '1', icon: Award, color: 'text-purple-500' },
];

const enrolledCourses = [
  { name: 'Professional Pastry & Baking', progress: 65, instructor: 'Chef Ada', nextClass: 'Tomorrow, 9:00 AM' },
  { name: 'Cake Decoration Masterclass', progress: 40, instructor: 'Chef Bola', nextClass: 'Wed, 2:00 PM' },
  { name: 'Food Safety & Hygiene', progress: 100, instructor: 'Mrs. Chioma', nextClass: 'Completed' },
];

const upcomingClasses = [
  { day: 'Today', time: '2:00 PM', class: 'Cake Decoration', room: 'Studio 1' },
  { day: 'Tomorrow', time: '9:00 AM', class: 'Professional Pastry', room: 'Kitchen A' },
  { day: 'Wed', time: '11:00 AM', class: 'Practical Lab', room: 'Kitchen B' },
];

export default function StudentDashboard() {
  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-6">
        {/* Welcome banner */}
        <Card className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Welcome back, Student!
                </h2>
                <p className="text-muted-foreground mt-1">
                  You're making great progress. Keep it up!
                </p>
              </div>
              <div className="hidden md:block">
                <Award className="w-16 h-16 text-purple-500/30" />
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

        {/* Courses and Schedule */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* My Courses */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                My Courses
              </CardTitle>
              <CardDescription>Your enrolled programs and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrolledCourses.map((course, index) => (
                  <div key={index} className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{course.name}</p>
                        <p className="text-sm text-muted-foreground">Instructor: {course.instructor}</p>
                      </div>
                      <span className={`text-sm font-medium ${course.progress === 100 ? 'text-green-500' : 'text-primary'}`}>
                        {course.progress}%
                      </span>
                    </div>
                    <Progress value={course.progress} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.nextClass}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming
              </CardTitle>
              <CardDescription>Your next classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingClasses.map((item, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {item.day}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    <p className="font-medium text-foreground text-sm">{item.class}</p>
                    <p className="text-xs text-muted-foreground">{item.room}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment reminder */}
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium text-foreground">Payment Due</p>
                <p className="text-sm text-muted-foreground">₦150,000 balance for current term</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Pay Now
            </button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
