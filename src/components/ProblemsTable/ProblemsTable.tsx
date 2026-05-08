import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BsCheckCircle } from 'react-icons/bs'
import { AiFillYoutube } from 'react-icons/ai'
import { IoClose } from 'react-icons/io5'
import YouTube from 'react-youtube'
import { supabase } from '@/supabase/supabase'
import { DBProblem } from '@/utils/types/problem'

type ProblemsTableProps = {
  setLoadingProblems: React.Dispatch<React.SetStateAction<boolean>>
}

const ProblemsTable: React.FC<ProblemsTableProps> = ({ setLoadingProblems }) => {
  const [problems, setProblems] = useState<DBProblem[]>([])
  const [solvedProblems, setSolvedProblems] = useState<string[]>([])
  const [youtubePlayer, setYoutubePlayer] = useState({
    isOpen: false,
    videoId: '',
  })
  const [user, setUser] = useState<any>(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch problems from Supabase
  useEffect(() => {
    const fetchProblems = async () => {
      setLoadingProblems(true)
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .order('order', { ascending: true })

      if (error) {
        console.error('Error fetching problems:', error)
      } else {
        setProblems(data || [])
      }
      setLoadingProblems(false)
    }
    fetchProblems()
  }, [setLoadingProblems])

  // Fetch solved problems for current user
  useEffect(() => {
    const fetchSolved = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('solved_problems')
        .select('problem_id')
        .eq('user_id', user.id)

      if (!error && data) {
        setSolvedProblems(data.map((d: any) => d.problem_id))
      }
    }
    fetchSolved()
  }, [user])

  const closeModal = () => setYoutubePlayer({ isOpen: false, videoId: '' })

  return (
    <div className='overflow-x-auto w-full'>
      <table className='text-sm text-left text-gray-500 dark:text-gray-400 sm:w-7/12 w-full max-w-[1200px] mx-auto'>
        <thead className='text-xs text-gray-700 uppercase dark:text-gray-400 border-b '>
          <tr>
            <th scope='col' className='px-1 py-3 w-0 font-medium'>
              Status
            </th>
            <th scope='col' className='px-6 py-3 w-0 font-medium'>
              Title
            </th>
            <th scope='col' className='px-6 py-3 w-0 font-medium'>
              Difficulty
            </th>
            <th scope='col' className='px-6 py-3 w-0 font-medium'>
              Category
            </th>
            <th scope='col' className='px-6 py-3 w-0 font-medium'>
              Solution
            </th>
          </tr>
        </thead>
        <tbody className='text-white'>
          {problems.map((problem, idx) => {
            const difficultyColor =
              problem.difficulty === 'Easy'
                ? 'text-dark-green-s'
                : problem.difficulty === 'Medium'
                ? 'text-dark-yellow'
                : 'text-dark-pink'

            return (
              <tr
                key={problem.id}
                className={`${idx % 2 === 1 ? 'bg-dark-layer-1' : ''}`}
              >
                {/* Status */}
                <th className='px-2 py-4 font-medium whitespace-nowrap text-dark-green-s'>
                  {solvedProblems.includes(problem.id) && (
                    <BsCheckCircle fontSize='18' width='18' />
                  )}
                </th>

                {/* Title */}
                <td className='px-6 py-4 whitespace-nowrap'>
                  <Link
                    href={`/problems/${problem.id}`}
                    className='hover:text-blue-600 cursor-pointer'
                  >
                    {problem.title}
                  </Link>
                </td>

                {/* Difficulty */}
                <td className={`px-6 py-4 ${difficultyColor}`}>
                  {problem.difficulty}
                </td>

                {/* Category */}
                <td className='px-6 py-4 whitespace-nowrap'>{problem.category}</td>

                {/* Solution */}
                <td className='px-6 py-4'>
                  {problem.video_id ? (
                    <AiFillYoutube
                      fontSize='28'
                      className='cursor-pointer hover:text-red-600'
                      onClick={() =>
                        setYoutubePlayer({ isOpen: true, videoId: problem.video_id! })
                      }
                    />
                  ) : (
                    <p className='text-gray-400'>Coming soon</p>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* YouTube Modal */}
      {youtubePlayer.isOpen && (
        <div className='fixed top-0 left-0 h-screen w-screen flex items-center justify-center z-50'>
          <div
            className='bg-black opacity-70 top-0 left-0 w-screen h-screen absolute'
            onClick={closeModal}
          ></div>
          <div className='w-full z-50 h-full px-6 relative max-w-4xl flex items-center justify-center'>
            <div className='w-full relative'>
              <IoClose
                fontSize='35'
                className='cursor-pointer absolute -top-16 right-0 text-white'
                onClick={closeModal}
              />
              <div className='aspect-video w-full'>
                <YouTube
                  videoId={youtubePlayer.videoId}
                  loading='lazy'
                  className='w-full h-full'
                  iframeClassName='w-full h-full rounded-lg'
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProblemsTable