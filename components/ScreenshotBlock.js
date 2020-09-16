import React from 'react';
// import PropTypes from 'prop-types';
import { Dimensions, Modal, View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Control from './Control';
import ErrorMessage from './ErrorMessage';

export default class ScreenshotBlock extends React.Component {

  static defaultProps = {
    screenshotCheckboxLabel:'Send screenshot with feedback?'
  };

  constructor(props) {
    super(props);
    this.thumbnailRatio = 0.25; // in relation to the height of the display
    this.overlayImageRatio = 0.9;  // in relation to display width or height

    let maxWidth = Dimensions.get('window').width * this.thumbnailRatio;
    let maxHeight = Dimensions.get('window').height * this.thumbnailRatio;

    this.state = {
      imageWidth:0,
      imageHeight:0,
      thumbnailWidth:maxWidth,
      thumbnailHeight:maxHeight,
      sizeSet:false,
      modalVisible:false
    };

    this.state[this.props.data.typeName] = {
      selected:this.props.formGroupState.value == 'send_screenshot',
      value:'send_screenshot'
    };
  }

  async UNSAFE_componentWillMount() {
    this.getSetImageSize()
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.formGroupState.screenshot && !this.state.sizeSet) {
      this.getSetImageSize();
    }
  }

  getSetImageSize() {

    const { formGroupState } = this.props;

    if (!this.state.sizeSet && typeof formGroupState.screenshot === 'string' && formGroupState.screenshot.length) {
      Image.getSize(`data:image/png;base64,${formGroupState.screenshot}`, (width,height) => {
        let maxWidth = Dimensions.get('window').width * this.overlayImageRatio;
        let maxHeight = Dimensions.get('window').height * this.overlayImageRatio;

        let imageSize = {};
        let thumbNailSize = {};

        if (height > maxHeight) {
          imageSize.width = width * (maxHeight / height);
          imageSize.height = maxHeight;
        } else if(width > maxWidth) {
          imageSize.width = maxWidth;
          imageSize.height = height * (maxWidth / width);
        } else {
          imageSize.width = width;
          imageSize.height = height;     
        }

        // determine the scale of the thumbnail in relation the image
        thumbNailSize.width =  imageSize.width * this.thumbnailRatio / this.overlayImageRatio;
        thumbNailSize.height =  imageSize.height * this.thumbnailRatio / this.overlayImageRatio;
        // keep the height of the thumbnail constant, so adjust the width only by the new height
        if(this.state.thumbnailWidth>0 && thumbNailSize.height>0) {
          thumbNailSize.width = thumbNailSize.width * this.state.thumbnailHeight / thumbNailSize.height;
        }

        this.setState({
          imageWidth:imageSize.width,
          imageHeight:imageSize.height,
          thumbnailWidth:thumbNailSize.width,
          // thumbnailHeight:thumbNailSize.height,
          sizeSet:true
        // },() => {
        //   this.props.onFormGroupValueChange('send_screenshot', this.props.data);
        })
      });
    }
  }

  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
  }

  renderOverlay = () => {
    const { data, formGroupState } = this.props;
    const { modalVisible } = this.state;
    const scaleAsPercentage=100*this.overlayImageRatio;

        const styles = StyleSheet.create({          
          overlayImage: {
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${scaleAsPercentage.toFixed(0)}%`,
            height: `${scaleAsPercentage.toFixed(0)}%`,
            resizeMode: 'contain'
          }, 
          modalBackgroundView: {
             margin: 20, 
             flex: 1, width: '100%', height: '100%', alignItems: "center", justifyContent:"center",
             backgroundColor: "#40404080"
          },
          centeredView: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 40
          }
        })

        return (
          this.state.sizeSet ?
          (
          <Modal transparent={true}
                  visible={modalVisible} animationType='fade'
                  onRequestClose={() => {
                    this.setModalVisible(false);
                  }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalBackgroundView}>
                <Image
                  source={{uri:`data:image/png;base64,${formGroupState.screenshot}`}}
                  style={styles.overlayImage}
                />
              </View>
            </View>
          </Modal>
          )
          : null
        );
    
    
  };

  renderThumbnail() {
    const { data, formGroupState } = this.props;

    let thumbnailStyle = {
      flex: 1,
      // height: maxHeight,
      // width: '100%' // maxWidth
    };

    return(
      this.state.sizeSet ?
      (
        <TouchableOpacity style={thumbnailStyle} 
        onPressIn={() => {
          this.setModalVisible(true);
        }}
        onPressOut={() => {
          this.setModalVisible(false);
        }}
        >
      <Image
        source={{uri:`data:image/png;base64,${formGroupState.screenshot}`}}
        style={thumbnailStyle}
        resizeMode={'contain'}
      />
      </TouchableOpacity>
      )
      : null
    );
  }

  pressHandler(key,value,data) {
    const updateParentState = () => {
      const value = this.state[this.props.data.typeName].selected ? this.state[this.props.data.typeName].value : '';
      this.props.onFormGroupValueChange(value, data);
    };

    this.setState((prevState) => {
      return {
        [key]: {
          ...prevState[key],
          selected:!prevState[key].selected
        }
      }
    },() => {
      updateParentState();
    });
  }

  screenshotContainer() {
    let screenshotContainerStyle = {
      ...Platform.select({
        ios: {
          shadowColor:'#000',
          shadowOffset:{width:0,height:2},
          shadowOpacity:0.3,
          shadowRadius:5,    
        },
        android: {
          elevation: 3,
          backgroundColor: 'white'
        },
      }),
      height:this.state.thumbnailHeight,
      width:this.state.thumbnailWidth
    };

    // if (Platform.OS !== 'android') {
      Object.assign(screenshotContainerStyle, {height:this.state.thumbnailHeight,width:this.state.thumbnailWidth})
    // }

    return(
      <View style={screenshotContainerStyle}>
        { this.renderThumbnail() }
        { this.renderOverlay() }
      </View>
    );
  }

  blocks() {

    const { data, formGroupState } = this.props;

    let controlProps = {
      checked:this.state[data.typeName].selected,
      label:this.props.screenshotCheckboxLabel,
      value:'send_screenshot',
      onPress:this.pressHandler.bind(this,data.typeName,'send_screenshot',data),
      type:'checkbox'
    };

    return (
      <View>
        { this.screenshotContainer() }
        <Control {...controlProps} />
      </View>
    );    
  }

  render() {
    const { formGroupState } = this.props;
    return (
      <View>
        {this.blocks()}
        <ErrorMessage 
          text={formGroupState.error}
          show={formGroupState.showError}
        />
      </View>
    );
  }
} 