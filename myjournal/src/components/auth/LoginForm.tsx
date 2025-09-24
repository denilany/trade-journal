"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { loginUser } from "@/lib/auth"
import { toast } from "sonner"

export const LoginForm = () => {
  const router = useRouter()
  const search = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await loginUser({ email, password, rememberMe }) as any
      if (error?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.")
        return
      }
      toast.success("Logged in successfully")
      const redirect = search.get("redirect") || "/"
      router.push(redirect)
    } catch (err: any) {
      toast.error(err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="off"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="remember" checked={rememberMe} onCheckedChange={(v:any)=> setRememberMe(Boolean(v))} />
        <Label htmlFor="remember">Remember me</Label>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}

export default LoginForm