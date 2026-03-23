"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@packages/base/components/ui/table";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Header } from "../components/header";
import { useAdminUsers } from "@/hooks/use-admin-users";

function roleBadge(role: string) {
  const colors: Record<string, string> = {
    superadmin: "bg-red-500/20 text-red-400",
    admin: "bg-blue-500/20 text-blue-400",
    user: "bg-white/10 text-white/60",
  };
  return (
    <Badge className={`border-0 ${colors[role] || colors.user}`} variant="secondary">
      {role}
    </Badge>
  );
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useAdminUsers({
    page,
    search: search || undefined,
    role: role !== "all" ? role : undefined,
    status: status !== "all" ? status : undefined,
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <Header pages={[]} page="Users" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-white">Users</h1>
            <p className="text-sm text-white/60">
              {pagination?.total ?? 0} total users
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, or username..."
              value={search}
            />
          </div>
          <Select
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            value={role}
          >
            <SelectTrigger className="w-[150px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superadmin">Superadmin</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            value={status}
          >
            <SelectTrigger className="w-[180px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
              <SelectItem value="profileComplete">Profile Complete</SelectItem>
              <SelectItem value="profileIncomplete">Profile Incomplete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 backdrop-blur-[10px]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Name</TableHead>
                <TableHead className="text-white/60">Email</TableHead>
                <TableHead className="text-white/60">Role</TableHead>
                <TableHead className="text-white/60">Profile</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow className="border-white/10" key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && users.length === 0 && (
                <TableRow className="border-white/10">
                  <TableCell
                    className="py-8 text-center text-white/40"
                    colSpan={6}
                  >
                    No users found
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow
                  className="border-white/10 transition-colors hover:bg-white/5"
                  key={user.id}
                >
                  <TableCell>
                    <Link
                      className="font-medium text-white hover:text-[#E6007A]"
                      href={`/users/${user.id}`}
                    >
                      {user.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-white/60">{user.email}</TableCell>
                  <TableCell>{roleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge
                      className={`border-0 ${
                        user.profileCompleted
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                      variant="secondary"
                    >
                      {user.profileCompleted ? "Complete" : "Incomplete"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge
                        className="border-0 bg-red-500/20 text-red-400"
                        variant="secondary"
                      >
                        Banned
                      </Badge>
                    ) : (
                      <Badge
                        className="border-0 bg-green-500/20 text-green-400"
                        variant="secondary"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-white/60">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                size="sm"
                variant="outline"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                size="sm"
                variant="outline"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
