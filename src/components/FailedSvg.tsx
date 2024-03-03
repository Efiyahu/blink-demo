import { motion } from 'framer-motion';

const FailedSvg = ({ show }: { show: boolean }) => {
  return (
    show && (
      <motion.div>
        <svg
          width="100px"
          height="100px"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0" />
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" />
          <g id="SVGRepo_iconCarrier">
            <motion.path
              d="M16 9L13.0001 11.9999M13.0001 11.9999L10 15M13.0001 11.9999L10.0002 9M13.0001 11.9999L16.0002 15M8 6H19C19.5523 6 20 6.44772 20 7V17C20 17.5523 19.5523 18 19 18H8L2 12L8 6Z"
              stroke="#db0000"
              stroke-width={1}
              stroke-linecap="round"
              stroke-linejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
            />{' '}
          </g>
        </svg>
      </motion.div>
    )
  );
};
export default FailedSvg;
