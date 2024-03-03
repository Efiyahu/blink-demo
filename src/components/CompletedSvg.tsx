import { motion } from 'framer-motion';

const CompletedSvg = ({ show }: { show: boolean }) => {
  return (
    show && (
      <motion.div>
        <svg
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d="M19.5479 7.26653L20.1812 6.49258L19.4072 5.85934L17.8593 4.59286L17.0853 3.95963L16.4521 4.73358L8.66618 14.2497L6.2 12.4001L5.4 11.8001L4.8 12.6001L3.6 14.2001L3 15.0001L3.8 15.6001L8.56691 19.1752L9.33382 19.7504L9.94087 19.0085L19.5479 7.26653Z"
            stroke-width={0.1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            stroke="green"
          />
        </svg>
      </motion.div>
    )
  );
};
export default CompletedSvg;
