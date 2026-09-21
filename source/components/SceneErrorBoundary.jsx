import React from 'react';
export default class SceneErrorBoundary extends React.Component {
 state = {failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed ? this.props.fallback : this.props.children;}
}
