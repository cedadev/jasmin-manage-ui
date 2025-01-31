// __mocks__/fwtheme-react-jasmin.js
const React = require("react");

module.exports = {
  PageHeader: ({ children }) => (
    <div className="row">
      <div className="col">
        <h1 className="border-bottom mt-4 mb-3">{children}</h1>
      </div>
    </div>
  ),
};
