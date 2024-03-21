import SuccessSVG from '../assets/success.svg';
import FailureSVG from '../assets/failure.svg';
import CloseSVG from '../assets/close.svg';

interface Props {
  open: boolean;
  type: 'success' | 'failure';
  message: string;
  btnText?: string;
  onClickBtn?: () => void;
}

const Modal = ({ open, type, message, btnText, onClickBtn }: Props) => {
  return (
    open && (
      <>
        <div className="backdrop" />
        <div className="modal">
          <div className="modal-wrapper">
            <img className="modal-close" src={CloseSVG} alt="close" />
            <img
              className="modal-svg"
              src={type === 'success' ? SuccessSVG : FailureSVG}
              alt="status"
            />
            <span className="modal-text">{message}</span>
            {btnText && (
              <button className="modal-btn" onClick={onClickBtn}>
                {btnText}
              </button>
            )}
          </div>
        </div>
      </>
    )
  );
};

export default Modal;
