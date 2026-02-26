import {
  View,
  Text,
  TouchableHighlight,
  KeyboardAvoidingView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Keyboard,
  Image
} from 'react-native'
import { useState, useRef, useContext } from 'react'
import { DOMAIN, IMAGE_MODELS } from '../../constants'
import { v4 as uuid } from 'uuid'
import { ThemeContext, AppContext } from '../context'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useActionSheet } from '@expo/react-native-action-sheet'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import * as Clipboard from 'expo-clipboard'
import { spacing } from '../theme'
import { Button, ChatInput } from '../components'

const { width } = Dimensions.get('window')

type ImagesState = {
  index: typeof uuid,
  values: any[]
}

export function Images() {
  const [callMade, setCallMade] = useState(false)
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)
  const [input, setInput] = useState('')
  const scrollViewRef = useRef<ScrollView | null>(null)
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<any>(null)
  const [images, setImages] = useState<ImagesState>({
    index: uuid,
    values: []
  })
  const {
    imageModel
  } = useContext(AppContext)

  const { showActionSheetWithOptions } = useActionSheet()

  const hideInput = false
  const buttonLabel = 'Generate'

  const imageEndpoint = 'gemini'
  const showImagePickerButton = !hideInput

  async function generate() {
    if (loading) return
    if (hideInput && !image) {
      console.log('no image selected')
      return
    } else if (!hideInput && !input) {
      console.log('no input')
      return
    }
    Keyboard.dismiss()
    const imageCopy = image
    const currentModel = IMAGE_MODELS[imageModel].name
    const providerLabel = 'Gemini'
    try {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({
          animated: true
        })
      }, 1)
      setCallMade(true)
      let imagesArray = [
        ...images.values, {
          user: input,
        }
      ]
      setImages(images => ({
        index: images.index,
        values: JSON.parse(JSON.stringify(imagesArray))
      }))

      let response

      const body = {
        prompt: input,
        model: imageModel
      } as any

      setLoading(true)
      setImage(null)
      setInput('')

      if (imageCopy) {
        const formData = new FormData()
        // @ts-ignore
        formData.append('file', {
          uri: imageCopy.uri.replace('file://', ''),
          name: uuid(),
          type: imageCopy.mimeType
        })
        for (const key in body) {
          formData.append(key, body[key])
        }

        response = await fetch(`${DOMAIN}/images/${imageEndpoint}`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(res => res.json())
      } else {
        response = await fetch(`${DOMAIN}/images/${imageEndpoint}`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }).then(res => res.json())
      }
      if (response.image) {
        imagesArray[imagesArray.length - 1].image = response.image
        imagesArray[imagesArray.length - 1].model = currentModel
        imagesArray[imagesArray.length - 1].provider = providerLabel
        setImages(i => ({
          index: i.index,
          values: imagesArray
        }))
        setLoading(false)
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({
            animated: true
          })
        }, 50)
      } else {
        setLoading(false)
        console.log('error generating image ...', response)
      }
    } catch (err) {
      setLoading(false)
      console.log('error generating image ...', err)
    }
  }

  function renderSelectedImage() {
    if (!image) return null
    return (
      <View style={styles.midFileNameContainer}>
        <Text style={styles.fileName}>
          {image.name || 'Image from Camera Roll'}
        </Text>
        <TouchableHighlight
          onPress={() => setImage(null)}
          underlayColor={'transparent'}
          accessibilityLabel="Remove selected image"
          accessibilityRole="button"
        >
          <View style={styles.closeIconContainer}>
            <MaterialIcons
              style={styles.closeIcon}
              name="close"
              color={theme.textColor}
              size={14}
            />
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  async function copyToClipboard(text:string) {
    await Clipboard.setStringAsync(text)
  }

  function clearPrompts() {
    setCallMade(false)
    setImages({
      index: uuid,
      values: []
    })
  }

  async function showClipboardActionsheet(d: any) {
    const cancelButtonIndex = 2
    showActionSheetWithOptions({
      options: ['Save image', 'Clear prompts', 'cancel'],
      cancelButtonIndex
    }, selectedIndex => {
      if (selectedIndex === Number(0)) {
        console.log('saving image ...')
        downloadImageToDevice(d.image)
      }
      if (selectedIndex === Number(1)) {
        clearPrompts()
      }
    })
  }

  async function downloadImageToDevice(url: string) {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        FileSystem.documentDirectory + uuid() + '.png',
      )
      try {
        await downloadResumable.downloadAsync()
      } catch (e) {
        console.error(e)
      }
    } catch (err) {
      console.log('error saving image ...', err)
    }
  }

  function onChangeText(val: string) {
    setInput(val)
  }

  async function chooseImage() {
    try {
      let res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      })
      if (!res || !res.assets) return
      setImage(res.assets[0])
    } catch (err) {
      console.log('error:', err)
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.container}
        keyboardVerticalOffset={110}
        >
        <ScrollView
          contentContainerStyle={!callMade && styles.scrollContentContainer}
          ref={scrollViewRef}
          keyboardShouldPersistTaps='handled'
          style={styles.scrollContainer}
        >
          {
            !callMade && (
              <View style={styles.midChatInputWrapper}>
                <View style={styles.midChatInputContainer}>
                  {
                    !hideInput && (
                      <>
                        <TextInput
                          onChangeText={onChangeText}
                          style={styles.midInput}
                          placeholder='What do you want to create?'
                          placeholderTextColor={theme.placeholderTextColor}
                          autoCorrect={true}
                          value={input}
                          accessibilityLabel="Image prompt input"
                        />
                        <View style={styles.midButtonRow}>
                          <TouchableHighlight
                            onPress={generate}
                            underlayColor={'transparent'}
                            style={styles.midButtonWrapper}
                            accessibilityLabel="Generate image"
                            accessibilityRole="button"
                            onLongPress={
                              () => {
                                Keyboard.dismiss()
                                {}
                              }
                            }
                          >
                            <View style={styles.midButtonStyle}>
                              <Ionicons
                                name="images-outline"
                                size={22} color={theme.tintTextColor}
                              />
                              <Text style={styles.midButtonText}>
                                Create
                              </Text>
                            </View>
                          </TouchableHighlight>
                          {showImagePickerButton && (
                            <Button
                              variant="ghost"
                              onPress={chooseImage}
                              accessibilityLabel="Choose image from gallery"
                            >
                              <Ionicons
                                name={image ? 'checkmark-circle' : 'camera-outline'}
                                size={20}
                                color={theme.textColor}
                              />
                            </Button>
                          )}
                        </View>
                      </>
                    )
                  }
                  {
                    hideInput && (
                      <Button
                        variant="primary"
                        onPress={image ? generate : chooseImage}
                        accessibilityLabel={image ? buttonLabel : 'Choose image'}
                        style={styles.midButtonStyle}
                      >
                        <Ionicons
                          name="images-outline"
                          size={22} color={theme.tintTextColor}
                        />
                        <Text style={styles.midButtonText}>
                          {
                            image ? buttonLabel : 'Choose image'
                          }
                        </Text>
                      </Button>
                    )
                  }
                  {renderSelectedImage()}
                  <Text style={styles.chatDescription}>
                    Generate images and art using natural language.
                  </Text>
                </View>
              </View>
            )
          }
          {
            images.values.map((v, index) => (
              <View key={index} style={styles.imageContainer}>
                {
                  v.user && (
                    <View style={styles.promptTextContainer}>
                      <TouchableHighlight
                        underlayColor={'transparent'}
                      >
                        <View style={styles.promptTextWrapper}>
                          <Text style={styles.promptText}>
                            {v.user}
                          </Text>
                        </View>
                      </TouchableHighlight>
                    </View>
                  )
                }
                {
                  v.image && (
                    <View>
                      <TouchableHighlight
                        onPress={() => showClipboardActionsheet(v)}
                        underlayColor={'transparent'}
                        accessibilityLabel="Save or manage image"
                        accessibilityRole="button"
                      >
                        <Image
                          source={{ uri: v.image }}
                          style={styles.image}
                          accessibilityLabel="Generated image"
                        />
                      </TouchableHighlight>
                      <View style={styles.modelLabelContainer}>
                          <Text style={
                            styles.modelLabelText
                          }>
                            Created with {v.provider || 'Gemini'} model {v.model}
                          </Text>
                        </View>
                    </View>
                  )
                }
              </View>
            ))
          }
          { loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator />
            </View>
          ) }
        </ScrollView>
        {
          callMade && (
            <>
              {
                !hideInput && (
                  <>
                    {renderSelectedImage()}
                    <ChatInput
                      value={input}
                      onChangeText={onChangeText}
                      onSubmit={generate}
                      placeholder="What else do you want to create?"
                      leftAction={
                        <Button
                          variant="ghost"
                          onPress={clearPrompts}
                          accessibilityLabel="Clear all prompts"
                          style={styles.clearButton}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={theme.textColor}
                          />
                        </Button>
                      }
                      rightAction={
                        <View style={styles.bottomActionRow}>
                          {showImagePickerButton && (
                            <Button
                              variant="ghost"
                              onPress={chooseImage}
                              accessibilityLabel="Attach image"
                              style={styles.attachIconButton}
                            >
                              <Ionicons
                                name="images-outline"
                                size={18}
                                color={theme.tintTextColor}
                              />
                            </Button>
                          )}
                          <Button
                            variant="icon"
                            onPress={generate}
                            accessibilityLabel="Generate image"
                            style={styles.buttonStyle}
                          >
                            <Ionicons
                              name="arrow-up"
                              size={20} color={theme.tintTextColor}
                            />
                          </Button>
                        </View>
                      }
                    />
                  </>
                )
              }
              {
                hideInput && (
                  <Button
                    variant="primary"
                    onPress={image ? generate : chooseImage}
                    accessibilityLabel={image ? buttonLabel : 'Choose image'}
                    style={styles.bottomButtonStyle}
                  >
                    <Ionicons
                      name="images-outline"
                      size={22} color={theme.tintTextColor}
                    />
                    <Text style={styles.midButtonText}>
                      {
                        image ? buttonLabel : 'Choose image'
                      }
                    </Text>
                  </Button>
                )
              }
            </>
          )
        }
      </KeyboardAvoidingView>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  midButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
  },
  midButtonWrapper: {
    flex: 1
  },
  closeIcon: {
    borderWidth: 1,
    padding: spacing.xs,
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
    borderRadius: 15
  },
  closeIconContainer: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  fileName: {
    color: theme.textColor,
    flex: 1,
  },
  midFileNameContainer: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: spacing.lg,
  },
  chatDescription: {
    color: theme.textColor,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontSize: 13,
    paddingHorizontal: spacing.xxxl,
    opacity: .8,
    fontFamily: theme.regularFont
  },
  modelLabelContainer: {
    padding: spacing.sm,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: theme.borderColor,
    paddingLeft: spacing.md,
    borderBottomLeftRadius: spacing.sm,
    borderBottomRightRadius: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  modelLabelText: {
    color: theme.mutedForegroundColor,
    fontFamily: theme.regularFont,
    fontSize: 13
  },
  loadingContainer: {
    marginVertical: spacing.xxl,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center'
  },
  image: {
    width: width - spacing.md,
    height: width - spacing.md,
    marginTop: spacing.xs,
    marginHorizontal: spacing.xs,
    borderRadius: spacing.sm,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  promptTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: spacing.xs,
    marginLeft: spacing.xxl,
    marginBottom: spacing.xs,
  },
  promptTextWrapper: {
    borderRadius: spacing.sm,
    borderTopRightRadius: 0,
    backgroundColor: theme.tintColor,
  },
  promptText: {
    color: theme.tintTextColor,
    fontFamily: theme.regularFont,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: 16
  },
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  scrollContentContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: spacing.md,
  },
  midButtonStyle: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 99,
    backgroundColor: theme.tintColor,
    justifyContent: 'center',
    alignItems: 'center'
  },
  midButtonText: {
    color: theme.tintTextColor,
    marginLeft: spacing.md,
    fontFamily: theme.boldFont,
    fontSize: 16
  },
  midChatInputWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  midChatInputContainer: {
    width: '100%',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  midInput: {
    marginBottom: spacing.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.xxl,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: 99,
    color: theme.textColor,
    borderColor: theme.borderColor,
    fontFamily: theme.mediumFont,
  },
  clearButton: {
    marginLeft: spacing.md,
  },
  attachIconButton: {
    marginRight: spacing.sm,
  },
  bottomButtonStyle: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.sm,
  },
  buttonStyle: {
    marginRight: spacing.lg,
  },
})
