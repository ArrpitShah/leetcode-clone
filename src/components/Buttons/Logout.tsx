import { supabase } from '@/supabase/supabase'
import { useRouter } from 'next/router'

const Logout: React.FC = () => {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <button
      onClick={handleLogout}
      className='bg-dark-fill-3 py-1.5 px-3 cursor-pointer rounded text-white hover:bg-dark-fill-2 text-sm'
    >
      Logout
    </button>
  )
}

export default Logout