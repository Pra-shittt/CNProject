package com.lansphere.network.security;

import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.springframework.stereotype.Component;

/** AES-GCM implementation that prefixes every ciphertext with its random IV. */
@Component
public class AesGcmCryptoSuite {
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;
    private final SecureRandom random = new SecureRandom();

    public byte[] encrypt(byte[] plaintext, SecretKey key) { return crypt(Cipher.ENCRYPT_MODE, plaintext, key, true); }
    public byte[] decrypt(byte[] ciphertext, SecretKey key) { return crypt(Cipher.DECRYPT_MODE, ciphertext, key, false); }

    private byte[] crypt(int mode, byte[] input, SecretKey key, boolean generateIv) {
        try {
            byte[] iv;
            byte[] data;
            if (generateIv) { iv = new byte[IV_BYTES]; random.nextBytes(iv); data = input; }
            else { if (input.length <= IV_BYTES) throw new IllegalArgumentException("Ciphertext is too short"); iv = java.util.Arrays.copyOf(input, IV_BYTES); data = java.util.Arrays.copyOfRange(input, IV_BYTES, input.length); }
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(mode, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] result = cipher.doFinal(data);
            return generateIv ? ByteBuffer.allocate(iv.length + result.length).put(iv).put(result).array() : result;
        } catch (GeneralSecurityException exception) { throw new IllegalStateException("Unable to process encrypted packet", exception); }
    }
}
