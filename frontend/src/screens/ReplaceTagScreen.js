import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GHeader from '../components/GHeader';
import GInput from '../components/GInput';
import GButton from '../components/GButton';
import api from '../api';
import { getStyles } from './ReplaceTagScreen.styles';
import { Tag, ArrowRight, CheckCircle2, Search, X } from 'lucide-react-native';
import GAlert from '../components/GAlert';

const ReplaceTagScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [existingTag, setExistingTag] = useState('');
  const [newTag, setNewTag] = useState('');
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const tagDebounceRef = useRef(null);
  const latestTagQueryRef = useRef('');

  const handleCheckTag = async (tag) => {
    const tagToSearch = tag || existingTag;
    if (!tagToSearch) return;

    latestTagQueryRef.current = tagToSearch;
    setLoading(true);
    try {
      const response = await api.get(`/animals/check-tag/${tagToSearch}`);
      if (latestTagQueryRef.current !== tagToSearch) return; // superseded by a newer keystroke
      setAnimal(response.data);
    } catch (error) {
      if (latestTagQueryRef.current !== tagToSearch) return;
      setAnimal(null);
    } finally {
      if (latestTagQueryRef.current === tagToSearch) setLoading(false);
    }
  };

  const handleExistingTagChange = (val) => {
    setExistingTag(val);
    if (tagDebounceRef.current) clearTimeout(tagDebounceRef.current);

    if (val.length < 3) {
      latestTagQueryRef.current = '';
      setLoading(false);
      setAnimal(null);
      return;
    }

    tagDebounceRef.current = setTimeout(() => handleCheckTag(val), 400);
  };

  const handleReplaceTag = async () => {
    if (!newTag) {
      Alert.alert('Error', 'Please enter a new Tag ID');
      return;
    }

    if (newTag === existingTag) {
      Alert.alert('Error', 'New Tag ID must be different from the existing one');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/animals/replace-tag', {
        oldTagNumber: existingTag,
        newTagNumber: newTag
      });
      
      setSuccessVisible(true);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to replace Tag ID';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <GHeader 
        title="Replace Tag ID" 
        onBack={() => navigation.goBack()} 
        leftAlign={true}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <GInput
            label="Existing Tag ID"
            value={existingTag}
            onChangeText={handleExistingTagChange}
            placeholder="Search old tag ID"
            autoCapitalize="characters"
            required
            editable={!submitting}
            rightIcon={
              loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : existingTag ? (
                <TouchableOpacity onPress={() => { setExistingTag(''); setAnimal(null); }}>
                  <X size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <Search size={20} color={theme.colors.textMuted} />
              )
            }
          />

          {existingTag.length >= 3 && !loading && !animal && (
            <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontFamily: theme.typography.medium }}>
                No animal found with this Tag ID
              </Text>
            </View>
          )}

          {animal && (
            <View style={styles.animalPreview}>
              <View style={styles.animalInfoRow}>
                <View style={styles.animalIconBox}>
                  <Tag color={theme.colors.primary} size={22} />
                </View>
                <View style={styles.animalDetails}>
                  <Text style={styles.animalTag}>{animal.tag_number}</Text>
                  <Text style={styles.animalSubInfo}>
                    {animal.breeds?.name || 'Unknown Breed'} • {animal.gender}
                  </Text>
                </View>
                <CheckCircle2 color={theme.colors.success || '#10B981'} size={22} />
              </View>
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <GInput 
              label="New Tag ID"
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Enter new tag ID"
              autoCapitalize="characters"
              required
              editable={!submitting}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GButton 
            title="Replace Tag"
            onPress={handleReplaceTag}
            loading={submitting}
            disabled={!existingTag || !newTag}
          />
        </View>
      </KeyboardAvoidingView>

      <GAlert 
        visible={successVisible}
        title="Tag Replaced!"
        message={`Successfully replaced ${existingTag} with ${newTag}.`}
        type="success"
        confirmText="Done"
        onClose={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
};

export default ReplaceTagScreen;
