import { supabase } from '@/supabase/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { BsList } from 'react-icons/bs'
import Timer from '../Timer/Timer'
import { problems } from '@/utils/problems'
import { Problem } from '@/utils/types/problem'
import ThemeToggle from '../Buttons/ThemeToggle'

type TopbarProps = {
  problemPage?: boolean
}

const Topbar: React.FC<TopbarProps> = ({ problemPage }) => {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const handleProblemChange = (isForward: boolean) => {
    const { order } = problems[router.query.pid as string] as Problem
    const direction = isForward ? 1 : -1
    const nextProblemOrder = order + direction
    const nextProblem = Object.values(problems).find(
      (p: any) => p.order === nextProblemOrder
    )
    if (nextProblem) {
      router.push(`/problems/${nextProblem.id}`)
    }
  }

  return (
    <nav className='relative flex h-[50px] w-full shrink-0 items-center px-4 sm:px-5 bg-dark-layer-1 text-dark-gray-7 border-b border-dark-fill-3'>

      {/* Left — Logo */}
      <div className='flex items-center gap-2 sm:gap-4 shrink-0'>
        <Link href='/'>
          <div className='flex items-center'>
            <Image src='/logo-full.png' alt='Logo' height={22} width={100} className='cursor-pointer' />
          </div>
        </Link>
        <div className='flex items-center gap-2 sm:gap-4 ml-4'>
            <Link href='/' className='font-medium text-dark-gray-8 hover:text-brand-orange transition-colors'>
                Problems
            </Link>
            <Link href='/contests' className='font-medium text-dark-gray-8 hover:text-brand-orange transition-colors'>
                Contests
            </Link>
            <Link href='/leaderboard' className='font-medium text-dark-gray-8 hover:text-brand-orange transition-colors'>
                Leaderboard
            </Link>
        </div>
      </div>

      {/* Right — Timer + Auth */}
      <div className='flex items-center space-x-2 sm:space-x-4 flex-1 justify-end'>

        <ThemeToggle />

        {problemPage && (
            <div className='flex items-center gap-2 sm:gap-4'>
                <button
                    className='font-medium text-dark-gray-8 hover:text-brand-orange transition-colors px-2 py-1 rounded-md'
                    onClick={() => handleProblemChange(false)}
                >
                    Prev Problem
                </button>
                <Link href='/' className='font-medium text-dark-gray-8 hover:text-brand-orange transition-colors px-2 py-1 rounded-md'>
                    Problem List
                </Link>
                <button
                    className='font-medium text-dark-gray-8 hover:text-brand-orange transition-colors px-2 py-1 rounded-md'
                    onClick={() => handleProblemChange(true)}
                >
                    Next Problem
                </button>
            </div>
        )}


        {!user ? (
          <Link href='/auth'>
            <button className='bg-dark-fill-3 py-1 sm:py-1.5 px-2 sm:px-3 cursor-pointer rounded text-brand-orange hover:bg-dark-fill-2 text-xs sm:text-sm whitespace-nowrap'>
              Sign In
            </button>
          </Link>
        ) : (
          <div className='flex items-center'>
            <div 
              className='w-7 h-7 sm:w-8 sm:h-8 bg-brand-orange flex items-center justify-center text-white font-bold text-xs sm:text-sm cursor-pointer hover:opacity-80 transition-opacity'
              onClick={() => router.push('/profile')}
              title='View Profile'
            >
              {user.email?.[0].toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Topbar