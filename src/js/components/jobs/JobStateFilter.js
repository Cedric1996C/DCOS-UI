import React, { Component } from "react";
import { Dropdown } from "reactjs-components";

/* eslint-enable no-unused-vars */
// import FilterInputText from "./FilterInputText";

class JobStateFilter extends Component {
  constructor(props) {
    super(...props);
  }

  getDropdownItems() {
    // const items = [defaultItem].concat(this.props.services);
    const items = [
      {
        name: "Success",
        num: 3
      },
      {
        name: "Scheduling",
        num: 9
      },
      {
        name: "In Queue",
        num: 1
      },
      {
        name: "Failed",
        num: 12
      },
      {
        name: "New",
        num: 2
      }
    ];

    return items.map(item => {
      var selectedHtml = this.getItemHtml(item);
      var dropdownHtml = <a>{selectedHtml}</a>;

      var state = {
        name: item.name,
        html: dropdownHtml,
        selectedHtml
      };

      if (state.name === "成功") {
        state.selectedHtml = <span>Filter by item</span>;
      }

      return state;
    });
  }

  getItemHtml(item) {
    return (
      <span className="badge-container">
        <span className="badge-container-text">{item.name}</span>
        <span className="badge badge-rounded">
          {item.num}
        </span>
      </span>
    );
  }

  handleItemSelection(obj) {
    if (obj.id === "defaultId") {
      this.props.handleFilterChange(null);
    } else {
      this.props.handleFilterChange(obj.id);
    }
  }

  render() {
    return (
      <Dropdown
        buttonClassName="button dropdown-toggle"
        dropdownMenuClassName="dropdown-menu"
        dropdownMenuListClassName="dropdown-menu-list"
        dropdownMenuListItemClassName="clickable"
        wrapperClassName="dropdown"
        items={this.getDropdownItems()}
        // initialID={this.getSelectedId(this.props.byitemFilter)}
        onItemSelection={this.handleItemSelection}
        ref={ref => (this.dropdown = ref)}
        scrollContainer=".gm-scroll-view"
        scrollContainerParentSelector=".gm-prevented"
        transition={true}
        transitionName="dropdown-menu"
      />
    );
  }
}

// JobSearchFilter.propTypes = {
//     onChange: React.PropTypes.func.isRequired,
//     value: React.PropTypes.string
// };

module.exports = JobStateFilter;
