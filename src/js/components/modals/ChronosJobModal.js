import { Modal } from "reactjs-components";
import React, { Component } from "react";

import ModalHeading from "../modals/ModalHeading";
import ChronosJobForm from "../jobs/ChronosJobForm";

class ChronosJobModal extends Component {
  constructor(props) {
    super(...props);
  }

  getModalHeader() {
    const heading = "New Job";

    return (
      <div className="header-left">
        <ModalHeading align="left" level={4}>
          {heading}
        </ModalHeading>
      </div>
    );
  }

  getModalContents() {
    return <ChronosJobForm />;
  }

  getModalFooter() {
    let submitLabel = "Create Job";
    if (this.props.isEdit) {
      submitLabel = "Save Job";
    }

    return (
      <div className="button-collection flush-bottom">
        <button className="button" onClick={this.handleCancel}>
          Cancel
        </button>
        <button className="button button-success" onClick={this.handleSubmit}>
          {submitLabel}
        </button>
      </div>
    );
  }

  render() {
    const { open, onClose } = this.props;

    return (
      <Modal
        backdropClass="modal-backdrop default-cursor"
        modalWrapperClass="multiple-form-modal modal-form"
        open={open}
        scrollContainerClass="multiple-form-modal-body"
        header={this.getModalHeader()}
        footer={this.getModalFooter()}
        showHeader={true}
        showFooter={true}
        onClose={onClose}
        useGemini={false}
        size="large"
      >
        {this.getModalContents()}
      </Modal>
    );
  }
}

module.exports = ChronosJobModal;
