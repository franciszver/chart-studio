'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { User, SignOut, UserCircle, SignIn } from 'phosphor-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ProfileDropdown() {
  const { user } = useUser()
  const { signOut, openUserProfile, openSignIn } = useClerk()

  // If user is not logged in, show sign-in button
  if (!user) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => openSignIn()}
        className="flex items-center gap-2"
      >
        <SignIn size={16} />
        Sign In
      </Button>
    )
  }

  const initials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.emailAddresses[0]?.emailAddress[0].toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.imageUrl} alt={user.fullName || ''} />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.fullName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <UserCircle size={16} className="mr-2" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <User size={16} className="mr-2" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <SignOut size={16} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
