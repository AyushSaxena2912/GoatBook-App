import React, { useState, useMemo } from 'react';
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
import { Tag, ArrowRight, CheckCircle2 } from 'lucide-react-native';

const ReplaceTagScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [existingTag, setExistingTag] = useState('');
  const [newTag, setNewTag] = useState('');
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCheckTag = async () => {
    if (!existingTag) {
      Alert.alert('Error', 'Please enter an existing Tag ID');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/animals/check-tag/${existingTag}`);
      setAnimal(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Tag ID not found in your farm';
      Alert.alert('Not Found', message);
      setAnimal(null);
    } finally {
      setLoading(false);
    }
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
      const response = await api.post('/animals/replace-tag', {
        oldTagNumber: existingTag,
        newTagNumber: newTag
      });
      
      Alert.alert('Success', response.data.message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
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
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <GInput 
                  label="Existing Tag Id*"
                  value={existingTag}
                  onChangeText={(val) => {
                    setExistingTag(val);
                    if (animal) setAnimal(null); // Reset if editing
                  }}
                  placeholder="Enter old tag number"
                  autoCapitalize="characters"
                  editable={!loading && !submitting}
                />
              </View>
              <TouchableOpacity 
                style={[
                  styles.addBtn,
                  (loading || submitting) && styles.btnDisabled
                ]}
                onPress={handleCheckTag}
                disabled={loading || submitting}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <View style={styles.plusCircle}>
                      <Text style={styles.plusText}>+</Text>
                    </View>
                    <Text style={styles.addBtnText}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {animal && (
              <View style={styles.animalPreview}>
                <View style={styles.divider} />
                <View style={styles.animalInfoRow}>
                  <View style={styles.animalIconBox}>
                    <Tag color={theme.colors.primary} size={24} />
                  </View>
                  <View style={styles.animalDetails}>
                    <Text style={styles.animalTag}>{animal.tag_number}</Text>
                    <Text style={styles.animalSubInfo}>
                      {animal.breeds?.name || 'Unknown Breed'} • {animal.gender}
                    </Text>
                  </View>
                  <CheckCircle2 color={theme.colors.success || '#10B981'} size={24} />
                </View>

                <View style={styles.replacementSection}>
                  <GInput 
                    label="Replace with New Tag ID*"
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Enter new tag number"
                    autoCapitalize="characters"
                    editable={!submitting}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {animal && (
          <View style={styles.footer}>
            <GButton 
              title="Replace"
              onPress={handleReplaceTag}
              loading={submitting}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default ReplaceTagScreen;
