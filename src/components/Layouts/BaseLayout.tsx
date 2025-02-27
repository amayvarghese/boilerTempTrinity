import React from 'react'
import Navbar from '../Navbar'
import Footer from '../Footer'
import { useOutlet } from 'react-router-dom'


const BaseLayout = () => {
  const outlet = useOutlet()
  return (
    <div className='flex flex-col min-h-screen justify-between'>
      {/* <Navbar /> */}
      <div className='flex-grow max-w-screen overflow-clip'>
        {outlet}
      </div>
      {/* <Footer/> */}
    </div>
  )
}

export default BaseLayout