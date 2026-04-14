"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Plus, 
  Search, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  LayoutGrid,
  List,
  LogOut,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { vendorsApi } from "@/lib/api";
import type { VendorRead } from "@/types/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddVendorModal } from "@/components/dashboard/AddVendorModal";
import { useAuth } from "@/lib/auth";


export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);


  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const data = await vendorsApi.list();
      setVendors(data.vendors);
    } catch (err) {
      console.error("Failed to load vendors", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: vendors.length,
    critical: vendors.filter(v => (v.latest_score ?? 100) < 50).length,
    passed: vendors.filter(v => (v.latest_score ?? 0) >= 75).length,
    avgScore: vendors.length > 0 
      ? Math.round(vendors.reduce((acc, v) => acc + (v.latest_score ?? 0), 0) / vendors.length) 
      : 0
  };

  return (
    <div className="min-h-screen bg-[#080B14] bg-mesh p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vendor Ecosystem</h1>
          <p className="text-slate-500 mt-1">Real-time compliance monitoring and risk intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/trends">
            <Button className="bg-white/5 hover:bg-white/10 border-white/10 text-slate-300">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trends
            </Button>
          </Link>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 border-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-400 hidden lg:block max-w-[100px] truncate">{user.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { logout(); router.push("/auth"); }}
                className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </header>


      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Vendors", value: stats.total, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Critical Risks", value: stats.critical, icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Passed Audits", value: stats.passed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Avg Ecosystem Score", value: stats.avgScore, suffix: "%", icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-6 border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="border-white/5 text-[10px] text-slate-500 uppercase tracking-tighter">Live</Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{stat.value}</span>
              {stat.suffix && <span className="text-sm text-slate-500 font-medium">{stat.suffix}</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="glass rounded-3xl border-white/5 p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search vendors or industries..." 
              className="pl-10 bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 text-sm h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg border border-white/5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 transition-all ${viewMode === 'grid' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 transition-all ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 shimmer border border-white/5" />
            ))}
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-500 italic">No vendors found matching your search.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor, i) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/dashboard/vendor/${vendor.id}`}>
                  <Card className="group glass p-5 border-white/5 hover:border-blue-500/30 hover:bg-white/[0.07] transition-all cursor-pointer relative overflow-hidden h-full">
                    {/* Grade Indicator */}
                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 bg-${vendor.latest_grade === 'A' ? 'emerald' : vendor.latest_grade === 'F' ? 'red' : 'blue'}-500`} />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                      {vendor.latest_score !== null && (
                        <div className="text-right">
                          <div className={`text-2xl font-black grade-${vendor.latest_grade}`}>
                            {vendor.latest_score}%
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Grade {vendor.latest_grade}</div>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{vendor.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{vendor.industry || "General"}</p>
                      <div className="w-1 h-1 rounded-full bg-slate-700" />
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{vendor.audit_count} Audits</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0E1221] bg-white/5 border border-white/10" />
                        ))}
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVendors.map((vendor, i) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/dashboard/vendor/${vendor.id}`}>
                  <div className="group glass p-4 border-white/5 hover:border-blue-500/30 hover:bg-white/[0.07] transition-all cursor-pointer flex items-center justify-between rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{vendor.name}</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{vendor.industry || "General"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-center hidden md:block">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Audits</p>
                        <p className="text-xs text-white font-mono">{vendor.audit_count}</p>
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Member Since</p>
                        <p className="text-xs text-white font-mono">{new Date(vendor.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                         {vendor.latest_score !== null && (
                           <div className="text-right">
                             <span className={`text-lg font-bold grade-${vendor.latest_grade}`}>{vendor.latest_score}%</span>
                           </div>
                         )}
                         <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AddVendorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadVendors}
      />

    </div>
  );
}
