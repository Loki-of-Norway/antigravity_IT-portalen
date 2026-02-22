'use client';

import Typewriter from 'typewriter-effect';

export default function Typing() {
    return (
        <Typewriter
            options={{
                strings: ['40+ skills', '11 workflows', '16 Agents', 'Open Source'],
                autoStart: true,
                loop: true,
                delay: 75,
                deleteSpeed: 50,
            }}
        />
    )
}