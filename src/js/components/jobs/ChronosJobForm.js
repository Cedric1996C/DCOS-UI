import { Form } from "reactjs-components";
import React, { Component } from "react";

class ChronosJobForm extends Component {
  getDefinition() {
    return [
      [
        {
          fieldType: "text",
          name: "description",
          placeholder: "First name",
          showError: 'Setting "showError" will make a field display an error',
          writeType: "input"
        },
        {
          fieldType: "text",
          name: "uid",
          placeholder: "Last name",
          required: true,
          value: "Last name",
          writeType: "input"
        }
      ],
      {
        fieldType: "password",
        name: "Password",
        helpBlock: "Setting helpBlock can be used to display helpful text",
        required: true,
        showLabel: true,
        validation: value => {
          return value && value.length > 8;
        },
        validationErrorText: "Password needs to be greater than 8 characters",
        writeType: "input"
      },
      {
        fieldType: "number",
        name: "Number",
        required: false,
        showLabel: true,
        max: "10",
        min: "0",
        step: "1",
        validation: value => {
          return value >= 0 && value <= 10;
        },
        validationErrorText: "Must be a positive integer between 0 and 10 representing its priority",
        writeType: "input"
      },
      {
        fieldType: "checkbox",
        name: "single-checkbox",
        checked: true,
        disabled: true,
        showLabel: "Accept terms of service",
        required: true,
        label: "Single checkbox",
        value: true,
        validation: value => {
          return value;
        },
        validationErrorText: "Must check checkbox!",
        writeType: "input"
      },
      {
        fieldType: "checkbox",
        value: [
          {
            name: "isManager",
            label: "Manager",
            checked: false
          },
          {
            name: "isDeveloper",
            label: "Developer",
            checked: false
          },
          {
            name: "isSRE",
            label: "SRE",
            checked: true
          }
        ],
        showLabel: "What is your role?",
        name: "role",
        validation: value => {
          const result = false;
          value.forEach(function(item) {
            return item.checked;
          });

          return result;
        },
        validationErrorText: "Please select at least one option.",
        writeType: "input"
      },
      {
        fieldType: "radioButton",
        value: [
          {
            disabled: true,
            name: "bananas",
            label: "Bananas (disabled)",
            checked: false
          },
          {
            name: "apple",
            label: "Apple",
            checked: false
          },
          {
            name: "pineapple",
            label: "Pineapple",
            checked: true
          },
          {
            name: "other",
            label: "Something else",
            checked: false
          }
        ],
        showLabel: "What is your favorite fruit?",
        name: "fruit",
        validation: value => {
          const result = false;
          value.forEach(function(item) {
            return item.checked;
          });

          return result;
        },
        validationErrorText: "Please select at least one option.",
        writeType: "input"
      },
      {
        fieldType: "select",
        label: "Level",
        showLabel: true,
        options: [
          {
            html: "Senior",
            id: "Senior"
          },
          {
            html: "Junior",
            id: "junior"
          }
        ],
        value: "junior",
        name: "level",
        validation: value => {
          return !!value;
        },
        validationErrorText: "One option has to be selected"
      },
      {
        fieldType: "textarea",
        name: "message",
        required: true,
        showLabel: "Message",
        validation: value => {
          return value && value.length < 140;
        },
        validationErrorText: "Message needs to be less than 140 characters",
        writeType: "input"
      },
      {
        fieldType: "submit",
        buttonText: "Submit",
        buttonClass: "button button-primary button-wide"
      }
    ];
  }

  render() {
    return <Form definition={this.getDefinition()} />;
  }
}

module.exports = ChronosJobForm;
