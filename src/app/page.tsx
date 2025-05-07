import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CreditCard,
  PieChart,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-6 pt-20 md:pt-32 text-center">
        <div className="flex items-center justify-center rounded-full bg-indigo-100 px-4 py-1 text-sm text-indigo-700 mb-4">
          <span>Splitting bills has never been easier</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Split Bills Easily with{" "}
          <span className="text-indigo-600">SplitEase</span>
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
          The easiest way to split bills with friends, track expenses, and
          settle payments without the hassle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link href="/auth">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </div>
        <div className="mt-12 w-full max-w-4xl overflow-hidden rounded-lg border bg-background shadow-md">
          <img
            src="/split-ease-1.jpg"
            alt="SplitEase app dashboard"
            className="w-full object-cover"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-6 md:mb-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              How It Works
            </h2>
            <p className="max-w-[700px] text-muted-foreground">
              Split bills with friends in just a few simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Create a group and add your friends",
                icon: <Users className="h-10 w-10 text-indigo-600" />,
              },
              {
                step: 2,
                title: "Add a new expense with details and amount",
                icon: <CreditCard className="h-10 w-10 text-indigo-600" />,
              },
              {
                step: 3,
                title: "Choose to split equally or manually",
                icon: <PieChart className="h-10 w-10 text-indigo-600" />,
              },
              {
                step: 4,
                title: "See who pays what to whom and settle up",
                icon: <Wallet className="h-10 w-10 text-indigo-600" />,
              },
            ].map((item) => (
              <Card key={item.step} className="border-none shadow-sm">
                <CardContent className="flex flex-col items-center text-center pt-6">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                    {item.icon}
                  </div>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
                    {item.step}
                  </div>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-6 md:mb-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Features
            </h2>
            <p className="max-w-[700px] text-muted-foreground">
              Everything you need to manage expenses with friends
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Easy expense tracking",
                description:
                  "Log expenses quickly with our intuitive interface",
                icon: <CreditCard className="h-6 w-6 text-indigo-600" />,
              },
              {
                title: "Equal or custom bill splitting",
                description:
                  "Split bills equally or customize amounts for each person",
                icon: <PieChart className="h-6 w-6 text-indigo-600" />,
              },
              {
                title: "Multiple groups for different occasions",
                description:
                  "Create separate groups for roommates, trips, and events",
                icon: <Users className="h-6 w-6 text-indigo-600" />,
              },
              {
                title: "Clear payment visualization",
                description: "See who owes what with easy-to-understand charts",
                icon: <Share2 className="h-6 w-6 text-indigo-600" />,
              },
              {
                title: "Simplified settling of payments",
                description: "Mark expenses as settled with just one tap",
                icon: <Wallet className="h-6 w-6 text-indigo-600" />,
              },
              {
                title: "Expense history",
                description: "Keep track of all past expenses and settlements",
                icon: <ArrowRight className="h-6 w-6 text-indigo-600" />,
              },
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-sm transition-shadow">
                <CardContent>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-indigo-100">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
            Ready to split bills without the drama?
          </h2>
          <p className="max-w-[700px] text-indigo-50 mb-8">
            Join thousands of users who are already enjoying stress-free expense
            sharing.
          </p>
          <Link href="/auth">
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <Logo className="text-xl mb-4 md:mb-0" />
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Contact Us
            </Link>
            <p>© 2025 SplitEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
